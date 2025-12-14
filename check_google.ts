
import axios from 'axios';

async function main() {
    try {
        console.log('Checking Google...');
        await axios.get('https://www.google.com', { timeout: 5000 });
        console.log('SUCCESS: Google is reachable.');
    } catch (e: any) {
        console.error('FAILURE: Google is NOT reachable:', e.message);
    }
}
main();
