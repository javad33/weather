// نمایش تاریخ شمسی در لحظه ورود
document.getElementById('shamsiDate').innerText = moment().locale('fa').format('YYYY/MM/DD');

// ۱. سیستم ساجسشن و جستجوی شهر (Geocoding)
async function searchCity() {
    const query = document.getElementById('cityInput').value;
    if (query.length < 3) return;

    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en`);
    const data = await res.json();
    
    const list = document.getElementById('suggestions');
    list.innerHTML = '';
    
    if (data.results) {
        data.results.forEach(city => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerText = `${city.name}, ${city.country}`;
            div.onclick = () => selectCity(city.latitude, city.longitude, city.name);
            list.appendChild(div);
        });
    }
}

// ۲. انتخاب شهر و دریافت دیتای اصلی
async function selectCity(lat, lon, name) {
    document.getElementById('suggestions').innerHTML = '';
    document.getElementById('cityInput').value = name;
    document.getElementById('loader').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';

    try {
        // دریافت همزمان هواشناسی و آلودگی هوا
        const [weatherRes, airRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`),
            fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`)
        ]);

        const weatherData = await weatherRes.json();
        const airData = await airRes.json();

        renderWeather(weatherData, airData, name);
    } catch (error) {
        alert("خطا در دریافت اطلاعات!");
    } finally {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    }
}

// ۳. نمایش دیتا در اپلیکیشن
function renderWeather(data, air, name) {
    document.getElementById('cityNameDisplay').innerText = name;
    document.getElementById('mainTemp').innerText = Math.round(data.current_weather.temperature) + "°C";
    
    // شاخص آلودگی
    const aqi = air.current.us_aqi;
    const aqiBadge = document.getElementById('aqiBadge');
    aqiBadge.innerText = `شاخص آلودگی: ${aqi}`;
    aqiBadge.style.background = aqi > 100 ? '#f44336' : (aqi > 50 ? '#ff9800' : '#4caf50');

    // پیش‌بینی ساعتی
    const hourlyList = document.getElementById('hourlyList');
    hourlyList.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        hourlyList.innerHTML += `
            <div class="hourly-item">
                <small>${i}:00</small>
                <div>${Math.round(data.hourly.temperature_2m[i])}°</div>
            </div>`;
    }

    // پیش‌بینی ۷ روزه
    const dailyList = document.getElementById('dailyList');
    dailyList.innerHTML = '';
    data.daily.time.forEach((date, index) => {
        const shamsiDay = moment(date).locale('fa').format('dddd');
        dailyList.innerHTML += `
            <div class="daily-item">
                <span>${shamsiDay}</span>
                <span>${Math.round(data.daily.temperature_2m_max[index])}° / ${Math.round(data.daily.temperature_2m_min[index])}°</span>
            </div>`;
    });
}
