const weatherCodes = {
    0: "آسمان صاف", 1: "عمدتاً صاف", 2: "نیمه ابری", 3: "ابری",
    45: "مه‌آلود", 48: "مه شدید", 51: "باران ریز", 61: "باران ملایم",
    71: "برش خفیف برف", 95: "رعد و برق"
};

document.getElementById('shamsiDate').innerText = moment().locale('fa').format('jD jMMMM jYYYY');

async function searchCity() {
    const query = document.getElementById('cityInput').value;
    const box = document.getElementById('suggestions');
    if (query.length < 3) { box.innerHTML = ''; return; }

    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5`);
        const data = await res.json();
        box.innerHTML = '';
        if (data.results) {
            data.results.forEach(city => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${city.name}, ${city.country}`;
                item.onclick = () => selectCity(city.latitude, city.longitude, city.name);
                box.appendChild(item);
            });
        }
    } catch (e) { console.error(e); }
}

async function selectCity(lat, lon, name) {
    document.getElementById('suggestions').innerHTML = '';
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('mainContent').classList.add('hidden');

    try {
        const [wRes, aRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`),
            fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`)
        ]);

        const weather = await wRes.json();
        const air = await aRes.json();
        renderApp(weather, air, name);
    } catch (e) { alert("خطا در برقراری ارتباط"); }
    finally {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('mainContent').classList.remove('hidden');
    }
}

function renderApp(data, air, cityName) {
    document.getElementById('cityNameDisplay').innerText = cityName;
    document.getElementById('mainTemp').innerText = Math.round(data.current_weather.temperature);
    document.getElementById('weatherDesc').innerText = weatherCodes[data.current_weather.weathercode] || "وضعیت فعلی";

    const aqi = air.current.us_aqi;
    const badge = document.getElementById('aqiBadge');
    badge.innerText = `شاخص آلودگی: ${aqi}`;
    badge.parentElement.style.background = aqi > 100 ? 'rgba(255,0,0,0.3)' : 'rgba(0,255,0,0.2)';

    // پیش‌بینی ساعتی
    const hList = document.getElementById('hourlyList');
    hList.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        hList.innerHTML += `
            <div class="hourly-item">
                <div style="font-size: 0.8rem; opacity: 0.7">${i}:00</div>
                <div style="font-size: 1.2rem; margin: 5px 0">${Math.round(data.hourly.temperature_2m[i])}°</div>
            </div>`;
    }

    // پیش‌بینی روزانه
    const dList = document.getElementById('dailyList');
    dList.innerHTML = '';
    data.daily.time.forEach((t, i) => {
        dList.innerHTML += `
            <div class="daily-item">
                <span>${moment(t).locale('fa').format('dddd')}</span>
                <span style="font-weight: bold">${Math.round(data.daily.temperature_2m_max[i])}° / ${Math.round(data.daily.temperature_2m_min[i])}°</span>
            </div>`;
    });
}
