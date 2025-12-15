
import axios from 'axios';
import { ClobClient } from '@polymarket/clob-client';
import { ethers } from 'ethers';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ENV Check
if (!process.env.PRIVATE_KEY) {
    console.error('❌ Missing PRIVATE_KEY in .env');
    // process.exit(1); 
}

// CONFIG
const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';
const POLYGON_RPC = process.env.RPC_URL || 'https://polygon-rpc.com';
const MARKET_SLUG = 'highest-temperature-in-nyc-on-december-15';
const BET_SIZE = 5; // $5 USD
const PRICE_LIMIT = 0.99;
const CHECK_INTERVAL = 60 * 1000; // 60s

// DB Client
const db = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// State
let lastProcessedLogId = -1;
let currentBetMarketId = "";

async function getLastWeatherLog() {
    try {
        const res = await db.query('SELECT * FROM "WeatherLog" ORDER BY "createdAt" DESC LIMIT 1');
        return res.rows[0];
    } catch (err) {
        console.error('DB Error:', err);
        return null;
    }
}

async function getMarketConditions() {
    try {
        const res = await axios.get(`${GAMMA_API}/events`, {
            params: { slug: MARKET_SLUG }
        });
        if (res.data && res.data.length > 0) {
            return res.data[0].markets;
        }
    } catch (err) {
        // console.error('Gamma API Error (Network?)');
    }
    return [];
}

function mapTempToMarket(temp: number, markets: any[]) {
    // console.log(`Mapping Temp ${temp}°F...`);
    for (const market of markets) {
        const title = market.groupItemTitle || market.question;

        // CASE 1: Range "20-30"
        const rangeMatch = title.match(/(\d+)\s*[-to]\s*(\d+)/);
        if (rangeMatch) {
            const min = parseInt(rangeMatch[1]);
            const max = parseInt(rangeMatch[2]);
            if (temp >= min && temp <= max) return market;
        }

        // CASE 2: "Under X"
        if (title.toLowerCase().includes('under') || title.includes('<')) {
            const num = title.match(/(\d+)/);
            if (num && temp < parseInt(num[1])) return market;
        }

        // CASE 3: "Over X"
        if (title.toLowerCase().includes('over') || title.toLowerCase().includes('above') || title.includes('>')) {
            const num = title.match(/(\d+)/);
            if (num && temp > parseInt(num[1])) return market;
        }
    }
    return null;
}

async function placeBet(tokenId: string, marketTitle: string) {
    if (process.env.PRIVATE_KEY === 'YOUR_PRIVATE_KEY_HERE') {
        console.log('⚠️ SIMULATION: Real keys missing. Would BUY YES on:', marketTitle);
        return;
    }

    try {
        const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
        const client = new ClobClient(CLOB_API_URL, 137, wallet);

        console.log('Authenticating...');
        await client.deriveApiKey();

        console.log(`💸 PLACING ORDER: Buy YES on "${marketTitle}" for $${BET_SIZE}`);
        /*
        const order = await client.createOrder({
            tokenID: tokenId,
            price: PRICE_LIMIT,
            side: 'BUY',
            size: BET_SIZE,
            feeRateBps: 0,
            nonce: 0 
        });
        console.log('✅ Order Placed:', order.orderID);
        */
        console.log('Simulation: Order Sent');

    } catch (err: any) {
        console.error('Betting Failed:', err.message);
    }
}

async function main() {
    const runOnce = process.argv.includes('--once');
    console.log(`🤖 Auto-Bet Bot Starting (${runOnce ? 'One-Shot Mode' : 'Watcher Mode'})...`);

    // LOOP
    do {
        console.log(`[${new Date().toLocaleTimeString()}] Checking Logic...`);

        // ... (Logic) ...


        // 1. Weather
        const weather = await getLastWeatherLog();
        if (weather && weather.id !== lastProcessedLogId) {
            console.log(`✨ New Weather Data: ${weather.maxTemp}°F`);
            lastProcessedLogId = weather.id;

            // 2. Markets
            const markets = await getMarketConditions();
            if (markets.length > 0) {
                const targetMarket = mapTempToMarket(weather.maxTemp, markets);

                if (targetMarket) {
                    console.log(`🎯 Strategy: Bet on "${targetMarket.groupItemTitle || targetMarket.question}"`);

                    if (targetMarket.id !== currentBetMarketId) {
                        console.log(`🚨 ACTION: Temp bucket changed! Placing bet...`);

                        if (targetMarket.clobTokenIds && targetMarket.clobTokenIds.length > 0) {
                            await placeBet(targetMarket.clobTokenIds[0], targetMarket.groupItemTitle);
                            currentBetMarketId = targetMarket.id;
                        } else {
                            console.error('Market closed/invalid.');
                        }
                    } else {
                        console.log('✅ Holding position.');
                    }
                }
            } else {
                console.log('Could not fetch markets (Network restricted?)');
            }
        } else {
            console.log('No new weather data.');
        }

        if (!runOnce) {
            await new Promise(r => setTimeout(r, CHECK_INTERVAL));
        }
    } while (!runOnce);
}

main();
