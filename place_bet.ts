
import { ClobClient } from '@polymarket/clob-client';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const POLYGON_RPC = process.env.RPC_URL || 'https://polygon-rpc.com';
const CLOB_API_URL = 'https://clob.polymarket.com';

async function main() {
    if (!PRIVATE_KEY) {
        console.error('Error: PRIVATE_KEY not found in .env file');
        process.exit(1);
    }

    try {
        console.log('Initializing wallet...');
        const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        console.log(`Wallet Address: ${wallet.address}`);

        console.log('Initializing CLOB Client...');
        const client = new ClobClient(CLOB_API_URL, 137, wallet); // 137 is Polygon Mainnet Chain ID

        // 1. You need to derive API credentials first (L2 Login)
        // This only authenticates, doesn't place order yet
        console.log('Deriving API Keys (Signing L2 Login)...');
        const credo = await client.deriveApiKey();
        console.log('Authenticated!');

        // 2. Define Order Details
        // Ideally, we fetch these from the market fetcher
        const TOKEN_ID = 'TOKEN_ID_FROM_FETCH_MARKET'; // You must replace this!
        const PRICE = 0.50; // Limit price (e.g., 50 cents)
        const SIZE = 10.0;  // Amount of shares? Or USDC? CTF uses amount of shares.
        // Polymarket orders are typically size = shares

        console.log(`Placing BUY Order for Token: ${TOKEN_ID}`);
        console.log(`Price: $${PRICE}, Size: ${SIZE}`);

        // 3. Place Order
        // Note: For a real bet, you need USDC balance and approved allowance for the CTF Exchange
        /*
        const order = await client.createOrder({
            tokenID: TOKEN_ID,
            price: PRICE,
            side: 'BUY',
            size: SIZE,
            feeRateBps: 0,
            nonce: 0 // Client handles nonce usually
        });
        
        console.log('Order Placed!', order);
        */

        console.log('Simulated Order Placement (Uncomment code to really bet)');
        console.log('NOTE: Ensure you have USDC on Polygon and have approved the Polymarket Exchange contract.');

    } catch (err: any) {
        console.error('Error:', err.message);
        if (err.response) console.error(err.response.data);
    }
}

main();
