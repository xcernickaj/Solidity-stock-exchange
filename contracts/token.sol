// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

 
// Your token contract
contract Token is Ownable, ERC20 
{
    string private constant _symbol = 'TT';                 // TODO: Give your token a symbol (all caps!)
    string private constant _name = 'TokenToken';                   // TODO: Give your token a name

    bool mint_enabled = true;

    uint private _totalSupply;
    mapping(address => uint) private _balances;
    mapping(address => mapping(address => uint)) private _allowances;

    constructor() ERC20(_name, _symbol) {}

    function totalSupply() public view virtual override returns (uint256) 
    {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual override returns (uint256)
    {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool)
    {
        require(to != address(0), "Transfer to zero address");
        require(_balances[msg.sender] >= amount, "insufficient balance");

        _balances[msg.sender] -= amount;
        _balances[to] += amount;

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view virtual override returns (uint256)
    {
        require(owner != address(0), "Transfer to zero address");
        require(spender != address(0), "Transfer from zero address");

        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool)
    {
        require(spender != address(0), "Approve to zero address");

        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool)
    {
        require(from != address(0), "From zero address");
        require(to != address(0), "To zero address");
        uint currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "Insufficient allowance");
        require(_balances[from] >= amount, "Insufficient balance");

        _balances[from] -= amount;
        _balances[to] += amount;

        _allowances[from][msg.sender] -= amount; 
        
        emit Transfer(from, to, amount);
        return true;
    }

    // ============================================================
    //                    FUNCTIONS TO IMPLEMENT
    // ============================================================

    // Function _mint: Create more of your tokens.
    // You can change the inputs, or the scope of your function, as needed.
    // Do not remove the AdminOnly modifier!
    function mint(uint amount) public onlyOwner
    {
        require(mint_enabled, "Mint has already been disabled.");
        _totalSupply += amount;
        _balances[msg.sender] += amount;
        emit Transfer(address(0), msg.sender, amount);
    }

    // Function _disable_mint: Disable future minting of your token.
    // You can change the inputs, or the scope of your function, as needed.
    // Do not remove the AdminOnly modifier!
    function disable_mint() public onlyOwner
    {
        require(mint_enabled, "Mint has already been disabled.");
        mint_enabled = false;
    }
}