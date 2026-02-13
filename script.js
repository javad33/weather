let tempChart;
let searchTimeout;

// دیکشنری وضعیت‌های آب‌وهوا با آیکون‌های FontAwesome (بدون خرابی لینک)
const weatherStates = {
    0: { text: "صاف", icon: "fa-sun" },
    1: { text: "کمی ابری", icon: "fa-cloud-sun" },
    2: { text: "نیمه ابری", icon: "fa-cloud-sun" },
    3: { text: "ابری", icon: "fa-cloud" },
    45: { text: "مه‌آلود", icon: "fa-smog" },
    48: { text: "مه غلیظ", icon: "fa-smog" },
    51: { text: "نم‌نم باران", icon: "fa-cloud-rain" },
    61: { text: "باران ملایم", icon: "fa-cloud-showers-water" },
    63: { text: "باران متوسط", icon: "fa-cloud-showers-heavy" },
    71: { text: "برف ملایم", icon: "fa-snowflake" },
    73: { text: "برف", icon: "fa-snowflake" },
    95: { text: "رعد و برق", icon: "fa-cloud-bolt" }
};

// تابع دریافت آیکون و متن
function getWeatherDetail(code) {
    return weatherStates[code] || { text: "نامشخص", icon: "fa-cloud" };
}

// سوئیچ بین صفحات (اصلی، جستجو، 7 روزه)
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden-view'));
    document.getElementById(viewId).classList.remove('hidden-view');
    // پاک کردن سرچ باکس موقع بستن
    if(viewId !== 'searchView') {
        document.getElementById('citySearchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
    }
}

// لود اولیه (تهران پیش‌فرض)
document.addEventListener('DOMContentLoaded', () => {
    selectCity(35.6892, 51.3890, 'تهران');
});

// دریافت اطلاعات کامل شهر انتخاب شده
async function selectCity(lat, lon, name) {
    document.getElementById('globalLoader').style.display = 'flex';
    switchView('mainView'); // برگشت به صفحه اصلی

    try {
        const [wRes, aRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`),
            fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`)
        ]);
        
        const wData = await wRes.json();
        const aData = await aRes.json();
        
        updateDashboard(wData, aData, name);
        updateWeekly(wData);
    } catch (e) { 
        alert("ارتباط با سرور هواشناسی برقرار نشد. اینترنت خود را چک کنید."); 
    } finally { 
        document.getElementById('globalLoader').style.display = 'none'; 
    }
}

// بروزرسانی صفحه اصلی
function updateDashboard(w, a, name) {
    const current = w.current;
    const detail = getWeatherDetail(current.weather_code);

    document.getElementById('cityNameDisplay').innerText = name;
    document.getElementById('mainTemp').innerText = Math.round(current.temperature_2m) + "°";
    document.getElementById('weatherDesc').innerText = detail.text;
    
    // آیکون اصلی
    document.getElementById('mainIconContainer').innerHTML = `<i class="fa-solid ${detail.icon}"></i>`;

    document.getElementById('windSpeed').innerText = current.wind_speed_10m + " km/h";
    document.getElementById('humidity').innerText = current.relative_humidity_2m + "%";
    document.getElementById('visibility').innerText = (current.visibility / 1000).toFixed(1) + " km";

    // کیفیت هوا
    const aqi = a.current.us_aqi;
    document.getElementById('aqiValue').innerText = aqi;
    let aqiColor = "#4caf50", aqiStatus = "خوب", aqiDesc = "هوا برای همه افراد مناسب است.";
    if (aqi > 50) { aqiColor = "#ff9800"; aqiStatus = "متوسط"; aqiDesc = "افراد حساس احتیاط کنند."; }
    if (aqi > 100) { aqiColor = "#f44336"; aqiStatus = "ناسالم"; aqiDesc = "هوا برای همه گروه‌ها ناسالم است."; }
    
    document.getElementById('aqiIndicator').style.backgroundColor = aqiColor;
    document.getElementById('aqiStatus').innerText = aqiStatus;
    document.getElementById('aqiDescription').innerText = aqiDesc;

    // پیش‌بینی 24 ساعته
    const hList = document.getElementById('hourlyList');
    hList.innerHTML = '';
    for (let i = 0; i < 24; i += 2) { // هر 2 ساعت
        const hDetail = getWeatherDetail(w.hourly.weather_code[i]);
        hList.innerHTML += `
            <div class="hourly-item">
                <span class="hourly-time">${i}:00</span>
                <i class="fa-solid ${hDetail.icon} hourly-icon"></i>
                <span class="hourly-temp">${Math.round(w.hourly.temperature_2m[i])}°</span>
            </div>`;
    }

    drawChart(w.hourly.temperature_2m.slice(0, 24));
}

// بروزرسانی صفحه 7 روزه
function updateWeekly(w) {
    const wList = document.getElementById('weeklyForecastList');
    wList.innerHTML = '';
    
    w.daily.time.forEach((date, i) => {
        const dayName = moment(date).locale('fa').format('dddd');
        const detail = getWeatherDetail(w.daily.weather_code[i]);
        const max = Math.round(w.daily.temperature_2m_max[i]);
        const min = Math.round(w.daily.temperature_2m_min[i]);

        wList.innerHTML += `
            <div class="weekly-item">
                <div class="weekly-day">${i === 0 ? 'امروز' : dayName}</div>
                <div class="weekly-icon"><i class="fa-solid ${detail.icon}"></i></div>
                <div class="weekly-temps">${max}° <span>${min}°</span></div>
            </div>`;
    });
}

// سیستم جستجوی شهرها (Geocoding)
function handleSearch() {
    clearTimeout(searchTimeout);
    const query = document.getElementById('citySearchInput').value;
    const resultsBox = document.getElementById('searchResults');
    
    if (query.length < 2) { resultsBox.innerHTML = ''; return; }

    resultsBox.innerHTML = '<div style="text-align:center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> در حال جستجو...</div>';

    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en`);
            const data = await res.json();
            resultsBox.innerHTML = '';
            
            if (data.results) {
                data.results.forEach(city => {
                    resultsBox.innerHTML += `
                        <div class="search-item" onclick="selectCity(${city.latitude}, ${city.longitude}, '${city.name}')">
                            <i class="fa-solid fa-location-dot"></i>
                            <div>
                                <strong>${city.name}</strong><br>
                                <small>${city.country}</small>
                            </div>
                        </div>`;
                });
            } else {
                resultsBox.innerHTML = '<div style="text-align:center; padding: 20px;">شهری پیدا نشد</div>';
            }
        } catch(e) { resultsBox.innerHTML = 'خطا در جستجو'; }
    }, 800); // صبر برای اتمام تایپ
}

// رسم نمودار
function drawChart(temps) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    if(tempChart) tempChart.destroy();
    
    Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
    Chart.defaults.font.family = 'Vazirmatn';

    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => i + ":00"),
            datasets: [{
                data: temps,
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.2)',
                borderWidth: 3,
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
                x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } }
            }
        }
    });
}
