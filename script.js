let tempChart;
let searchTimeout;
let forecastChart; // New chart for extended forecast

// Comprehensive weather condition dictionary with detailed descriptions
const weatherStates = {
    0: { text: "صاف", icon: "fa-sun", description: "آسمان کاملاً صاف و بدون ابر", color: "#FFD700" },
    1: { text: "کمی ابری", icon: "fa-cloud-sun", description: "تعداد اندکی ابر در آسمان", color: "#B0E0E6" },
    2: { text: "نیمه ابری", icon: "fa-cloud-sun", description: "آسمان نیمه‌پوشیده از ابر", color: "#A9A9A9" },
    3: { text: "ابری", icon: "fa-cloud", description: "آسمان کاملاً ابری", color: "#708090" },
    45: { text: "مه‌آلود", icon: "fa-smog", description: "وضعیت مه‌آلود", color: "#C0C0C0" },
    48: { text: "مه غلیظ", icon: "fa-smog", description: "مه غلیظ با کاهش دید", color: "#A9A9A9" },
    51: { text: "نم‌نم باران", icon: "fa-cloud-rain", description: "نم‌نم باران سبک", color: "#7B68EE" },
    53: { text: "باران سبک", icon: "fa-cloud-drizzle", description: "باران سبک و ملایم", color: "#4682B4" },
    56: { text: "باران متوسط", icon: "fa-cloud-showers-heavy", description: "باران با شدت متوسط", color: "#0000FF" },
    61: { text: "باران ملایم", icon: "fa-cloud-showers-water", description: "باران ملایم", color: "#4169E1" },
    63: { text: "باران شدید", icon: "fa-cloud-showers-heavy", description: "باران شدید", color: "#00008B" },
    65: { text: "رگبار باران", icon: "fa-cloud-showers-heavy", description: "رگبارهای کوتاه اما شدید", color: "#191970" },
    71: { text: "برف ملایم", icon: "fa-snowflake", description: "برف سبک", color: "#F0F8FF" },
    73: { text: "برف", icon: "fa-snowflake", description: "برف با شدت متوسط", color: "#DCDCDC" },
    75: { text: "برف سنگین", icon: "fa-snowflake", description: "برف با شدت زیاد", color: "#FFFFFF" },
    95: { text: "رعد و برق", icon: "fa-cloud-bolt", description: "رعد و برق با احتمال باران", color: "#4B0082" },
    96: { text: "رعد و برق سبک", icon: "fa-bolt", description: "رعد و برق با باران سبک", color: "#8A2BE2" },
    99: { text: "رعد و برق شدید", icon: "fa-bolt", description: "رعد و برق با باران شدید", color: "#9400D3" }
};

// Additional weather details mapping
const weatherDetails = {
    temperature: { label: "دما", unit: "°C", icon: "fa-temperature-half" },
    feels_like: { label: "احساس می‌شود", unit: "°C", icon: "fa-temperature-low" },
    humidity: { label: "رطوبت", unit: "%", icon: "fa-droplet" },
    wind_speed: { label: "سرعت باد", unit: "km/h", icon: "fa-wind" },
    wind_direction: { label: "جهت باد", unit: "°", icon: "fa-compass" },
    pressure: { label: "فشار", unit: "hPa", icon: "fa-gauge-high" },
    visibility: { label: "دید", unit: "km", icon: "fa-eye" },
    uv_index: { label: "اشعه UV", unit: "", icon: "fa-sun" },
    dew_point: { label: "نقطه شبنم", unit: "°C", icon: "fa-droplet" },
    cloud_cover: { label: "پوشش ابر", unit: "%", icon: "fa-cloud" },
    precipitation: { label: "بارش", unit: "mm", icon: "fa-umbrella" },
    sunrise: { label: "طلوع آفتاب", unit: "", icon: "fa-sun" },
    sunset: { label: "غروب آفتاب", unit: "", icon: "fa-moon" }
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
        const [wRes, aRes, fRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,surface_pressure,cloud_cover,visibility,uv_index,precipitation,dew_point_2m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,snow_depth,weather_code,pressure_msl,cloud_cover,wind_speed_10m,wind_direction_10m,shortwave_radiation,direct_radiation,diffuse_radiation,evapotranspiration,et0_fao_evapotranspiration,vapour_pressure_deficit,cape&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,daylight_duration,sunshine_duration&timezone=auto`),
            fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,o3,no2,so2,co&hourly=pm2_5,pm10,o3,no2,so2,co&timezone=auto`),
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,precipitation_probability_max&forecast_days=16&timezone=auto`) // Extended forecast
        ]);
        
        const wData = await wRes.json();
        const aData = await aRes.json();
        const fData = await fRes.json(); // Extended forecast data
        
        updateDashboard(wData, aData, name);
        updateWeekly(wData);
        updateExtendedForecast(fData); // Update extended forecast
    } catch (e) { 
        console.error("Error fetching weather data:", e);
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

    // اضافه کردن اطلاعات بیشتر
    updateDetailedInfo(w, a);

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

// بروزرسانی اطلاعات تفصیلی
function updateDetailedInfo(w, a) {
    const current = w.current;
    
    // ایجاد کارت اطلاعات تفصیلی
    const detailedInfoHTML = `
        <div class="detailed-weather-info">
            <div class="detail-grid">
                <div class="detail-card">
                    <i class="fa-solid fa-temperature-low"></i>
                    <div>
                        <h4>احساس می‌شود</h4>
                        <p>${Math.round(current.apparent_temperature)}°</p>
                    </div>
                </div>
                <div class="detail-card">
                    <i class="fa-solid fa-gauge-high"></i>
                    <div>
                        <h4>فشار</h4>
                        <p>${Math.round(current.pressure_msl)} hPa</p>
                    </div>
                </div>
                <div class="detail-card">
                    <i class="fa-solid fa-cloud"></i>
                    <div>
                        <h4>ابر</h4>
                        <p>${current.cloud_cover}%</p>
                    </div>
                </div>
                <div class="detail-card">
                    <i class="fa-solid fa-sun"></i>
                    <div>
                        <h4>اشعه UV</h4>
                        <p>${Math.round(current.uv_index)}</p>
                    </div>
                </div>
                <div class="detail-card">
                    <i class="fa-solid fa-umbrella"></i>
                    <div>
                        <h4>بارش</h4>
                        <p>${current.precipitation} mm</p>
                    </div>
                </div>
                <div class="detail-card">
                    <i class="fa-solid fa-droplet"></i>
                    <div>
                        <h4>نقطه شبنم</h4>
                        <p>${Math.round(current.dew_point_2m)}°</p>
                    </div>
                </div>
                <div class="detail-card">
                    <i class="fa-solid fa-wind"></i>
                    <div>
                        <h4>سرعت باد</h4>
                        <p>${current.wind_speed_10m} km/h</p>
                    </div>
                </div>
                <div class="detail-card">
                    <i class="fa-solid fa-compress-alt"></i>
                    <div>
                        <h4>رطوبت</h4>
                        <p>${current.relative_humidity_2m}%</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // اضافه کردن به صفحه اصلی
    const mainView = document.getElementById('mainView');
    if (!document.querySelector('.detailed-weather-info')) {
        mainView.insertAdjacentHTML('beforeend', detailedInfoHTML);
    }
    
    // به‌روزرسانی مقادیر
    document.querySelector('.detail-card:nth-child(1) p').textContent = `${Math.round(current.apparent_temperature)}°`;
    document.querySelector('.detail-card:nth-child(2) p').textContent = `${Math.round(current.pressure_msl)} hPa`;
    document.querySelector('.detail-card:nth-child(3) p').textContent = `${current.cloud_cover}%`;
    document.querySelector('.detail-card:nth-child(4) p').textContent = `${Math.round(current.uv_index)}`;
    document.querySelector('.detail-card:nth-child(5) p').textContent = `${current.precipitation} mm`;
    document.querySelector('.detail-card:nth-child(6) p').textContent = `${Math.round(current.dew_point_2m)}°`;
    document.querySelector('.detail-card:nth-child(7) p').textContent = `${current.wind_speed_10m} km/h`;
    document.querySelector('.detail-card:nth-child(8) p').textContent = `${current.relative_humidity_2m}%`;
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

// بروزرسانی پیش‌بینی گسترده (16 روز آینده)
function updateExtendedForecast(f) {
    // Create extended forecast view if it doesn't exist
    let extendedView = document.getElementById('extendedForecastView');
    if (!extendedView) {
        const appContainer = document.querySelector('.app-container');
        const extendedHTML = `
            <div id="extendedForecastView" class="view-section hidden-view">
                <header class="app-header">
                    <button class="icon-btn" onclick="switchView('mainView')"><i class="fa-solid fa-arrow-right"></i></button>
                    <h2>پیش‌بینی 16 روزه</h2>
                    <div style="width: 45px;"></div>
                </header>
                <div id="extendedForecastList" class="extended-forecast-list"></div>
            </div>
        `;
        appContainer.insertAdjacentHTML('beforeend', extendedHTML);
    }
    
    const extList = document.getElementById('extendedForecastList');
    extList.innerHTML = '';
    
    f.daily.time.forEach((date, i) => {
        if (i >= 8) { // Start from day 8 to show days beyond the weekly forecast
            const dayName = moment(date).locale('fa').format('dddd DD MMM');
            const detail = getWeatherDetail(f.daily.weather_code[i]);
            const max = Math.round(f.daily.temperature_2m_max[i]);
            const min = Math.round(f.daily.temperature_2m_min[i]);
            
            // Calculate precipitation chance
            const precipChance = f.daily.precipitation_probability_max ? 
                Math.round(f.daily.precipitation_probability_max[i]) : 'N/A';
            
            extList.innerHTML += `
                <div class="extended-forecast-item">
                    <div class="ext-day">${dayName}</div>
                    <div class="ext-icon"><i class="fa-solid ${detail.icon}"></i></div>
                    <div class="ext-temps">${max}° <span>${min}°</span></div>
                    <div class="ext-precip">%
                        <i class="fa-solid fa-umbrella"></i>
                        <span>${precipChance}</span>
                    </div>
                </div>`;
        }
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
