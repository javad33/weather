async function getWeather() {
    const city = document.getElementById('cityInput').value;
    const card = document.getElementById('weatherContent');
    
    if (!city) return;

    try {
        const res = await fetch(`https://wttr.in/${city}?format=j1`);
        const data = await res.json();
        
        const current = data.current_condition[0];

        // اعمال انیمیشن ورود
        card.classList.remove('animate__fadeInUp');
        void card.offsetWidth; // ریست کردن انیمیشن
        card.classList.add('animate__fadeInUp');

        document.getElementById('temp').innerText = current.temp_C + "°C";
        document.getElementById('cityName').innerText = city.toUpperCase();
        document.getElementById('humidity').innerText = current.humidity + "%";
        document.getElementById('windSpeed').innerText = current.windspeedKmph + " km/h";

        // تغییر آیکون بر اساس وضعیت (ساده شده)
        const desc = current.weatherDesc[0].value.toLowerCase();
        if(desc.includes("cloud")) {
            document.getElementById('weatherIcon').src = "https://cdn-icons-png.flaticon.com/512/414/414927.png";
        } else if(desc.includes("rain")) {
            document.getElementById('weatherIcon').src = "https://cdn-icons-png.flaticon.com/512/3351/3351979.png";
        } else {
            document.getElementById('weatherIcon').src = "https://cdn-icons-png.flaticon.com/512/4814/4814268.png";
        }

    } catch (error) {
        alert("شهر مورد نظر پیدا نشد!");
    }
}
