const API_URL = 'http://localhost:5001/api';

(async () => {
    try {
        console.log('1. Logging in as Kaprodi...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'kaprodi_informatika',
                password: 'password123'
            })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('   Login successful, token obtained.');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        console.log('\n2. Fetching Course 14...');
        const courseRes = await fetch(`${API_URL}/courses/14`, { headers });
        console.log('   Course Status:', courseRes.status);
        if (courseRes.ok) {
            const courseData = await courseRes.json();
            console.log('   Course Data:', JSON.stringify(courseData, null, 2));
        } else {
            console.log('   Failed to fetch course:', await courseRes.text());
        }

        console.log('\n3. Fetching RPS Versions for Course 14...');
        const versionsRes = await fetch(`${API_URL}/rps/versions/14`, { headers });
        console.log('   Versions Status:', versionsRes.status);
        if (versionsRes.ok) {
            const versionsData = await versionsRes.json();
            console.log('   Versions Data:', JSON.stringify(versionsData, null, 2));
        } else {
            console.log('   Failed to fetch versions:', await versionsRes.text());
        }

    } catch (error) {
        console.error('Script failed:', error.message);
    }
})();
