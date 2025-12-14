
import axios from 'axios';

const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';

async function main() {
    const slug = 'highest-temperature-in-nyc-on-december-15';
    console.log(`Fetching event: ${slug}...`);

    try {
        // 0. Check General Connectivity
        try {
            console.log('Checking General Internet (Google)...');
            await axios.get('https://www.google.com', { timeout: 5000 });
            console.log('Internet is reachable.');
        } catch (e: any) {
            console.error('General Internet Check Failed:', e.message);
        }

        // 0. Check Health
        try {
            console.log('Checking Gamma API Health...');
            await axios.get(`${GAMMA_API}/health`, { timeout: 5000 });
            console.log('Gamma API is healthy.');
        } catch (e: any) {
            console.error('Gamma API Health Check Failed:', e.message);
        }

        try {
            console.log('Checking CLOB API Health...');
            const clobTime = await axios.get(`${CLOB_API}/time`, { timeout: 5000 });
            console.log('CLOB API is healthy (Server Time):', clobTime.data);
        } catch (e: any) {
            console.error('CLOB API Health Check Failed:', e.message);
        }

        // 1. Get Event Details from Gamma
        console.log('Querying Gamma API for Event...');
        const eventRes = await axios.get(`${GAMMA_API}/events`, {
            params: { slug },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 15000
        });

        if (!eventRes.data || eventRes.data.length === 0) {
            console.error('Event not found!');
            return;
        }

        const event = eventRes.data[0];
        console.log(`\nEvent Found: ${event.title}`);
        console.log(`Event ID: ${event.id}`);
        console.log(`Markets Found: ${event.markets.length}`);

        // 2. Iterate through markets
        for (const market of event.markets) {
            console.log(`\n-----------------------------------`);
            console.log(`Market: ${market.groupItemTitle || market.question}`);
            console.log(`Market ID: ${market.id}`);

            // Look for clobTokenIds
            if (market.clobTokenIds && market.clobTokenIds.length > 0) {
                const tokenId = market.clobTokenIds[0]; // Usually 'Yes' outcome
                console.log(`Token ID: ${tokenId}`);

                // 3. Get Price from CLOB Order Book
                try {
                    const bookRes = await axios.get(`${CLOB_API}/book`, {
                        params: { token_id: tokenId }
                    });

                    const bestAsk = bookRes.data.asks.length > 0 ? bookRes.data.asks[0].price : 'No offers';
                    const bestBid = bookRes.data.bids.length > 0 ? bookRes.data.bids[0].price : 'No bids';

                    // Price is roughly the probability (0.0 to 1.0)
                    console.log(`\n🎯 Live Prices (Odds):`);
                    console.log(`  BUY 'YES' (Ask): ${bestAsk}`);
                    console.log(`  SELL 'YES' (Bid): ${bestBid}`);

                } catch (err: any) {
                    console.log('Error fetching order book:', err.message);
                }
            } else {
                console.log('No CLOB Token ID found (market might be closed or invalid).');
            }
        }

    } catch (err: any) {
        console.error('Error Object:', err);
        if (axios.isAxiosError(err)) {
            console.error('Axios Error Code:', err.code);
            console.error('Axios Response:', err.response?.data);
        }
    }
}

main();
