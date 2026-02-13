let tempChart;
const weatherCodes = {
    0: "صاف", 1: "عمدتاً صاف", 2: "نیمه ابری", 3: "ابری",
    45: "مه‌آلود", 48: "مه شدید", 51: "باران ریز", 61: "باران",
    63: "باران شدید", 71: "برف خفیف", 73: "برف", 95: "رعد و برق"
};

// برای تست، یک شهر پیش‌فرض را لود می‌کنیم
document.addEventListener('DOMContentLoaded', () => {
    selectCity(35.6892, 51.3890, 'تهران');
});

async function selectCity(lat, lon, name) {
    document.getElementById('loader').style.display = 'flex';
    try {
        const [wRes, aRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility&hourly=temperature_2m,weather_code&timezone=auto`),
            fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`)
        ]);
        const wData = await wRes.json();
        const aData = await aRes.json();
        
        renderApp(wData, aData, name);
    } catch (e) { alert("خطا در دریافت اطلاعات"); }
    finally { document.getElementById('loader').style.display = 'none'; }
}

function renderApp(w, a, name) {
    // کارت اصلی
    document.getElementById('cityNameDisplay').innerText = name;
    document.getElementById('mainTemp').innerText = Math.round(w.current.temperature_2m) + "°";
    document.getElementById('weatherDesc').innerText = weatherCodes[w.current.weather_code] || "نامشخص";
    document.getElementById('windSpeed').innerText = w.current.wind_speed_10m + " km/h";
    document.getElementById('humidity').innerText = w.current.relative_humidity_2m + "%";
    document.getElementById('visibility').innerText = (w.current.visibility / 1000).toFixed(1) + " km";
    document.getElementById('mainWeatherIcon').src = getWeatherIcon(w.current.weather_code);

    // پیش‌بینی ساعتی
    const hList = document.getElementById('hourlyList');
    hList.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        hList.innerHTML += `
            <div class="hourly-item">
                <span class="hourly-time">${i}:00</span>
                <img src="${getWeatherIcon(w.hourly.weather_code[i])}" class="hourly-icon">
                <span class="hourly-temp">${Math.round(w.hourly.temperature_2m[i])}°</span>
            </div>`;
    }

    // کیفیت هوا
    const aqi = a.current.us_aqi;
    const aqiInd = document.getElementById('aqiIndicator');
    document.getElementById('aqiValue').innerText = aqi;
    let status = "خوب", color = "#4caf50", desc = "کیفیت هوا رضایت‌بخش است.";
    if (aqi > 50) { status = "متوسط"; color = "#ff9800"; desc = "ممکن است برای گروه‌های حساس مضر باشد."; }
    if (aqi > 100) { status = "ناسالم"; color = "#f44336"; desc = "برای همه گروه‌ها ناسالم است."; }
    aqiInd.style.background = color;
    document.getElementById('aqiStatus').innerText = status;
    document.getElementById('aqiDescription').innerText = desc;

    // نمودار
    drawChart(w.hourly.temperature_2m.slice(0, 24));
}

function getWeatherIcon(code) {
    // برای سادگی، از آیکون‌های ثابت استفاده می‌کنیم. در پروژه واقعی می‌توان از منابع معتبرتر استفاده کرد.
    if (code === 0) return "https://cdn-icons-png.flaticon.com/512/869/869869.png";
    if (code >= 1 && code <= 3) return "https://cdn-icons-png.flaticon.com/512/1163/1163624.png";
    if (code >= 45) return "https://cdn-icons-png.flaticon.com/512/4151/4151022.png";
    if (code >= 51) return "https://cdn-icons-png.flaticon.com/512/3351/3351979.png";
    return "https://cdn-icons-png.flaticon.com/512/869/869869.png";
}

function drawChart(temps) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    if(tempChart) tempChart.destroy();
    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => i + ":00"),
            datasets: [{
                data: temps,
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)', maxTicksLimit: 6 } }
            }
        }
    });
}
