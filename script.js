let myChart;

// آپدیت زمان و تاریخ
function updateDateTime() {
    const now = moment();
    document.getElementById('shamsiDate').innerText = now.locale('fa').format('jD jMMMM jYYYY');
    document.getElementById('currentTime').innerText = now.format('HH:mm');
}
setInterval(updateDateTime, 1000);

async function searchCity() {
    const q = document.getElementById('cityInput').value;
    if(q.length < 3) return;
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=5`);
    const data = await res.json();
    const sug = document.getElementById('suggestions');
    sug.innerHTML = data.results ? data.results.map(c => 
        `<div onclick="selectCity(${c.latitude}, ${c.longitude}, '${c.name}')">${c.name}, ${c.country}</div>`).join('') : '';
}

async function selectCity(lat, lon, name) {
    document.getElementById('suggestions').innerHTML = '';
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('weatherContent').style.display = 'none';

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,pressure_msl,surface_pressure,uv_index,visibility&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;

    try {
        const [wRes, aRes] = await Promise.all([fetch(url), fetch(airUrl)]);
        const wData = await wRes.json();
        const aData = await aRes.json();
        
        displayWeather(wData, aData, name);
        drawChart(wData.hourly.temperature_2m.slice(0, 24));
    } finally {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('weatherContent').style.display = 'block';
    }
}

function displayWeather(w, a, name) {
    document.getElementById('cityName').innerText = name;
    document.getElementById('temp').innerText = Math.round(w.current.temperature_2m);
    document.getElementById('humidity').innerText = w.current.relative_humidity_2m + "%";
    document.getElementById('wind').innerText = w.current.wind_speed_10m + " km/h";
    document.getElementById('pressure').innerText = Math.round(w.current.surface_pressure) + " hPa";
    document.getElementById('uv').innerText = w.current.uv_index;
    document.getElementById('visibility').innerText = (w.current.visibility / 1000).toFixed(1) + " km";
    document.getElementById('aqi').innerText = a.current.us_aqi;
    
    // تغییر رنگ پس‌زمینه بر اساس روز یا شب
    document.getElementById('dynamicBg').style.background = w.current.is_day ? 
        'linear-gradient(180deg, #4facfe 0%, #00f2fe 100%)' : 'linear-gradient(180deg, #09203f 0%, #537895 100%)';

    // لیست هفتگی
    const list = document.getElementById('weeklyList');
    list.innerHTML = w.daily.time.map((t, i) => `
        <div class="weekly-item">
            <span>${moment(t).locale('fa').format('dddd')}</span>
            <span>${Math.round(w.daily.temperature_2m_max[i])}° / ${Math.round(w.daily.temperature_2m_min[i])}°</span>
        </div>
    `).join('');
}

function drawChart(temps) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => i + ":00"),
            datasets: [{
                label: 'دما',
                data: temps,
                borderColor: '#ffce45',
                backgroundColor: 'rgba(255, 206, 69, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false }, ticks: { color: '#fff' } } } }
    });
}
