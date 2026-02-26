# Solidity-stock-exchange
Smart contract simulating real stock exchange market in a decentralised system. Also includes a simple web overlay for viewing the current simulated stock situation, as well as performing exchanges.

It is built with Solidity, providing a smart contract-based platform for stock trading. It includes a basic web interface made with HTML, CSS, and JavaScript for interacting with the contract. This project was developed as part of a school assignment.

## Project Overview

The smart contract implements a stock exchange where users can buy and sell stocks. The contract allows the following operations:
- **Buying stocks**: Users can buy stocks by sending Ether to the contract.
- **Selling stocks**: Users can sell their stocks and receive Ether in return.
- **Stock tracking**: The contract tracks the stocks owned by each user.
  
The web interface offers users a simple way to interact with the contract. The frontend is built using HTML, CSS, and JavaScript, allowing users to view stock prices, check their balance, and perform buy/sell operations.

## Project Structure

- **contracts/**: Contains the Solidity smart contract for the stock exchange.
  - `StockExchange.sol`: The main contract, containing logic for buying, selling, and tracking stocks.
  
- **public/**: Contains the frontend files.
  - `index.html`: The main HTML file for displaying the stock exchange interface.
  - `style.css`: The CSS file for styling the web interface.
  - `app.js`: The JavaScript file responsible for interacting with the smart contract and updating the UI.

## Features

- **Smart contract-based trading**: The stock exchange is powered by a Solidity smart contract.
- **Web interface**: A simple and user-friendly web interface built with HTML, CSS, and JavaScript for interacting with the contract.
- **Buy and sell stocks**: Users can buy and sell stocks using the web interface.
- **Stock ownership tracking**: The contract keeps track of which stocks belong to which user.

## How to Use

1. **Set up the project**: 
   - Clone or download the repository.
   - Install the required dependencies for Solidity development (like Truffle or Hardhat).

2. **Compile and Deploy the Contract**:
   - Use your Solidity development environment (e.g., Truffle, Hardhat) to compile and deploy the contract to your local or test network.
   
3. **Running the Web Interface**:
   - Open `index.html` in a browser to access the stock exchange interface.
   - Make sure you have MetaMask or another Ethereum wallet connected to interact with the smart contract.

4. **Interact with the Contract**:
   - From the web interface, users can buy and sell stocks by selecting options in the UI.
   - The contract will track the stocks owned by each user and update balances accordingly.

## Documentation

The documentation within the project is heavily influenced by the requirements of the school assignment and is designed to answer specific questions posed by the assignment. As a result, some parts of the documentation may not be entirely clear or intuitive to someone new to the project or unfamiliar with the assignment questions. Please keep this in mind while reviewing the code and documentation.

## Requirements

- **Solidity**: For the smart contract development.
- **Truffle/Hardhat**: For compiling and deploying the smart contract.
- **MetaMask**: For interacting with the smart contract from the web interface.
- **Ethereum network (local or testnet)**: To deploy and test the contract.

## Known Issues and Limitations

- The stock exchange is a very basic prototype and lacks advanced features like real-time stock price updates, transaction history, or an order book.
- The web interface is a minimal implementation and does not include user authentication or advanced UI/UX design.
- The documentation may be difficult to follow for newcomers due to its focus on answering specific assignment questions rather than explaining the project in a more general context.

## Conclusion

This project provides a simple, blockchain-based stock exchange using Solidity, with a web-based frontend for interacting with it. It is a school project and may not be suitable for real-world use without further development and improvements. Please note that the documentation has been tailored to meet the specific needs of the assignment, so it might be a bit confusing for anyone unfamiliar with the questions posed.

Feel free to explore the code and web interface, and contribute if you'd like to improve it!
