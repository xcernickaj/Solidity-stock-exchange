// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


import './token.sol';
import "hardhat/console.sol";




contract TokenExchange is Ownable {

    event LiquidityAdded(
        address indexed provider,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 liquidityMinted
    );

    event LiquidityRemoved(
        address indexed provider,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 liquidityMinted
    );

    string public constant exchange_name = 'CeilingStreet';     

    Token public token;                        

    // Liquidity pool for the exchange
    uint private token_reserves = 0;
    uint private eth_reserves = 0;

    mapping(address => uint) private lps;
     
    // Needed for looping through the keys of the lps mapping
    address[] private lp_providers;       

    // liquidity rewards
    uint private constant swap_fee_numerator = 3;   
    uint private constant swap_fee_denominator = 100;

    uint private constant rate_decimals = 3;

    // Constant: x * y = k
    uint private k;

    constructor(address tokenAddr) {
        token = Token(tokenAddr);   
    }
    

    // Function createPool: Initializes a liquidity pool between your Token and ETH.
    // ETH will be sent to pool in this transaction as msg.value
    // amountTokens specifies the amount of tokens to transfer from the liquidity provider.
    // Sets up the initial exchange rate for the pool by setting amount of token and amount of ETH.
    function createPool(uint amountTokens) external payable onlyOwner
    {
        // This function is already implemented for you; no changes needed.

        // require pool does not yet exist:
        require (token_reserves == 0, "Token reserves was not 0.");
        require (eth_reserves == 0, "ETH reserves was not 0.");

        // require nonzero values were sent
        require (msg.value > 0, "Need eth to create pool.");
        uint tokenSupply = token.balanceOf(msg.sender);
        require (amountTokens <= tokenSupply, "Not have enough tokens to create the pool.");
        require (amountTokens > 0, "Need tokens to create pool.");

        bool success = token.transferFrom(msg.sender, address(this), amountTokens);
        require(success, "Unsuccessful transfer.");

        token_reserves = token.balanceOf(address(this));
        eth_reserves = msg.value;
        k = token_reserves * eth_reserves;
    }

    // Function removeLP: removes a liquidity provider from the list.
    // This function also removes the gap left over from simply running "delete".
    function removeLP(uint index) private {
        require(index < lp_providers.length, "specified index is larger than the number of lps");
        lp_providers[index] = lp_providers[lp_providers.length - 1];
        lp_providers.pop();
    }

    // Function getSwapFee: Returns the current swap fee ratio to the client.
    function getSwapFee() public pure returns (uint, uint) {
        return (swap_fee_numerator, swap_fee_denominator);
    }

    // ============================================================
    //                    FUNCTIONS TO IMPLEMENT
    // ============================================================
    
    /* ========================= Liquidity Provider Functions =========================  */ 

    // Function addLiquidity: Adds liquidity given a supply of ETH (sent to the contract as msg.value).
    // You can change the inputs, or the scope of your function, as needed.
    // exchange_rate => (token / ether) 10 ^ 8
    function addLiquidity(uint max_exchange_rate, uint min_exchange_rate) external payable
    {
        uint tokenBalanceCurr = token.balanceOf(address(this));
        uint weiBalanceCurr = address(this).balance;
        uint weiBalanceAfter = weiBalanceCurr - msg.value;
        /******* TODO: Implement this function *******/
        // require nonzero values were sent
        require (msg.value > 0, "Need eth to add liquidity.");
        uint exchange_rate = (tokenBalanceCurr * (10 ** rate_decimals)) / weiBalanceAfter;
        require (exchange_rate <= max_exchange_rate, "Exchange rate is larger than the max exchange rate.");
        require (exchange_rate >= min_exchange_rate, "Exchange rate is smaller than the min exchange rate.");
        uint tokenSupply = token.balanceOf(msg.sender);
        uint amountTokens = (tokenBalanceCurr * msg.value) / weiBalanceAfter;

        require (amountTokens <= tokenSupply, "Not have enough tokens to add to liquidity.");

        token.transferFrom(msg.sender, address(this), amountTokens);

        uint previous_liquidity = lps[msg.sender];
        if (lps[msg.sender] == 0) 
            lp_providers.push(msg.sender);
        
        token_reserves = tokenBalanceCurr + amountTokens;
        eth_reserves = weiBalanceCurr;
        k = token_reserves * eth_reserves;

        for (uint i = 0; i < lp_providers.length; i++) {
            uint lp_balance = lps[lp_providers[i]] * weiBalanceAfter;
            if (lp_providers[i] == msg.sender)
                lp_balance += msg.value * (10 ** rate_decimals);
            lps[lp_providers[i]] = lp_balance / eth_reserves;
        }

        emit LiquidityAdded(msg.sender, amountTokens, msg.value, lps[msg.sender] - previous_liquidity);
    }


    // Function removeLiquidity: Removes liquidity given the desired amount of ETH to remove.
    // You can change the inputs, or the scope of your function, as needed.
    function removeLiquidity(uint amountETH, uint max_exchange_rate, uint min_exchange_rate) public
    {
        uint tokenBalanceCurr = token.balanceOf(address(this));
        uint weiBalanceCurr = address(this).balance;
        /******* TODO: Implement this function *******/
        uint exchange_rate = (tokenBalanceCurr * (10 ** rate_decimals)) / weiBalanceCurr;
        require (exchange_rate <= max_exchange_rate, "Exchange rate is larger than the max exchange rate.");
        require (exchange_rate >= min_exchange_rate, "Exchange rate is smaller than the min exchange rate.");
        uint lp_balance = (lps[msg.sender] * weiBalanceCurr) / (10 ** rate_decimals);
        require (lp_balance >= amountETH, "Not enough liquidity in pool for this provider.");

        uint amountTokens = (tokenBalanceCurr * amountETH) / weiBalanceCurr;

        require(eth_reserves - amountETH > 0, "Not enough ethers to transfer.");
        require(token_reserves - amountTokens > 0, "Not enough tokens to transfer.");

        uint previous_liquidity = lps[msg.sender];

        token_reserves = tokenBalanceCurr - amountTokens;
        eth_reserves = weiBalanceCurr - amountETH;
        k = token_reserves * eth_reserves;

        uint lp_index;
        for (uint i = 0; i < lp_providers.length; i++) {
            lp_balance = lps[lp_providers[i]] * weiBalanceCurr;
            if (lp_providers[i] == msg.sender) {
                lp_balance -= amountETH * (10 ** rate_decimals);
                lp_index = i;
            }
            lps[lp_providers[i]] = lp_balance / eth_reserves;
        }

        if (lps[msg.sender] == 0)
            removeLP(lp_index);

        (bool success, ) = payable(msg.sender).call{value: amountETH}("");
        require(success, "ETH transfer failed");
        token.transfer(msg.sender, amountTokens);
        
        emit LiquidityRemoved(msg.sender, amountTokens, amountETH, previous_liquidity - lps[msg.sender]);
    }

    // Function removeAllLiquidity: Removes all liquidity that msg.sender is entitled to withdraw
    // You can change the inputs, or the scope of your function, as needed.
    function removeAllLiquidity(uint max_exchange_rate, uint min_exchange_rate) external
    {
        uint tokenBalanceCurr = token.balanceOf(address(this));
        uint weiBalanceCurr = address(this).balance;
        /******* TODO: Implement this function *******/
        uint exchange_rate = (tokenBalanceCurr * (10 ** rate_decimals)) / weiBalanceCurr;
        require (exchange_rate <= max_exchange_rate, "Exchange rate is larger than the max exchange rate.");
        require (exchange_rate >= min_exchange_rate, "Exchange rate is smaller than the min exchange rate.");
        uint amountETH = (lps[msg.sender] * weiBalanceCurr) / (10 ** rate_decimals);
        require(amountETH > 0, "No liquidity owned.");

        uint amountTokens = (tokenBalanceCurr * amountETH) / weiBalanceCurr;

        require(eth_reserves - amountETH > 0, "Not enough ethers to transfer.");
        require(token_reserves - amountTokens > 0, "Not enough tokens to transfer.");

        uint previous_liquidity = lps[msg.sender];

        token_reserves = tokenBalanceCurr - amountTokens;
        eth_reserves = weiBalanceCurr - amountETH;
        k = token_reserves * eth_reserves;

        uint lp_index;
        for (uint i = 0; i < lp_providers.length; i++) {
            uint lp_balance = lps[lp_providers[i]] * weiBalanceCurr;
            if (lp_providers[i] == msg.sender) {
                lp_balance -= amountETH * (10 ** rate_decimals);
                lp_index = i;
            }
            lps[lp_providers[i]] = lp_balance / eth_reserves;
        }

        if (lps[msg.sender] == 0)
            removeLP(lp_index);

        (bool success, ) = payable(msg.sender).call{value: amountETH}("");
        require(success, "ETH transfer failed");
        token.transfer(msg.sender, amountTokens);
    
        emit LiquidityRemoved(msg.sender, amountTokens, amountETH, previous_liquidity - lps[msg.sender]);
    }
    /***  Define additional functions for liquidity fees here as needed ***/

    function getRateDecimals() public pure returns (uint) {
        return rate_decimals;
    }

    function getProviderLiquidity(address account) public view returns (uint) {
        return (lps[account] * address(this).balance) / (10 ** rate_decimals);
    }

    /* ========================= Swap Functions =========================  */ 

    // Function swapTokensForETH: Swaps your token with ETH
    // You can change the inputs, or the scope of your function, as needed.
    function swapTokensForETH(uint amountTokens, uint max_exchange_rate) external payable
    {
        /******* TODO: Implement this function *******/
        uint exchange_rate = (token.balanceOf(address(this)) * (10 ** rate_decimals)) / (address(this).balance - msg.value);
        require (exchange_rate <= max_exchange_rate, "Exchange rate is larger than the max exchange rate.");

        uint amountETH = eth_reserves - (k / (token_reserves + amountTokens));
        uint amountETH_transferred = (amountETH * (swap_fee_denominator - swap_fee_numerator)) / swap_fee_denominator;

        require(eth_reserves - amountETH_transferred > 0, "Not enough ethers to transfer.");

        token.transferFrom(msg.sender, address(this), amountTokens);

        (bool success, ) = payable(msg.sender).call{value: amountETH_transferred}("");
        require(success, "ETH transfer failed");
        
        token_reserves = token_reserves + amountTokens;
        eth_reserves = eth_reserves - amountETH_transferred;
    }

    // Function swapETHForTokens: Swaps ETH for your tokens
    // ETH is sent to contract as msg.value
    // You can change the inputs, or the scope of your function, as needed.
    function swapETHForTokens(uint max_exchange_rate) external payable 
    {
        /******* TODO: Implement this function *******/
        uint exchange_rate = ((address(this).balance - msg.value) * (10 ** rate_decimals)) / token.balanceOf(address(this));
        require (exchange_rate <= max_exchange_rate, "Exchange rate is larger than the max exchange rate.");

        uint amountTokens = token_reserves - (k / (eth_reserves + msg.value));
        uint amountTokens_transferred = (amountTokens * (swap_fee_denominator - swap_fee_numerator)) / swap_fee_denominator;

        require(token_reserves - amountTokens_transferred > 0, "Not enough tokens to transfer.");

        token.transfer(msg.sender, amountTokens_transferred);
        
        token_reserves = token_reserves - amountTokens_transferred;
        eth_reserves = eth_reserves + msg.value;
    }
}
