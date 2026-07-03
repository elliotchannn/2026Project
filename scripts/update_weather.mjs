import fs from "node:fs/promises";
import path from "node:path";

const outputFile = path.resolve("weather-cache.json");
const api = new URL("https://api.open-meteo.com/v1/forecast");
api.search = new URLSearchParams({
  latitude: "22.5415",
  longitude: "114.0596",
  timezone: "Asia/Shanghai",
  forecast_days: "10",
  daily: [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max",
    "wind_speed_10m_max",
  ].join(","),
}).toString();

const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const watchItems = ["雷阵雨", "高温", "台风", "强对流"];

function weatherText(code) {
  if ([0].includes(code)) return "晴";
  if ([1, 2].includes(code)) return "多云";
  if ([3].includes(code)) return "阴";
  if ([45, 48].includes(code)) return "雾";
  if ([51, 53, 55, 56, 57].includes(code)) return "毛毛雨";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "阵雨";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "降雪";
  if ([95, 96, 99].includes(code)) return "雷阵雨";
  return "天气待确认";
}

function todayInShenzhen() {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

function fallback(existing, error) {
  return {
    ...(existing || {}),
    updatedAt: todayInShenzhen(),
    note: `天气自动更新失败，暂用上次缓存。错误：${String(error).slice(0, 90)}`,
  };
}

async function readExisting() {
  try {
    return JSON.parse(await fs.readFile(outputFile, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const existing = await readExisting();
  try {
    const response = await fetch(api, { headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
    const payload = await response.json();
    const daily = payload.daily;
    const weather = {
      location: "深圳市福田区",
      updatedAt: todayInShenzhen(),
      source: "Open-Meteo Forecast API（深圳福田坐标）",
      note: "天气由 GitHub Actions 每天北京时间 06:00 自动更新；用于施工窗口风险提示。",
      daily: daily.time.map((date, index) => {
        const code = daily.weather_code[index];
        const summary = weatherText(code);
        const probability = daily.precipitation_probability_max[index];
        const day = new Date(`${date}T00:00:00+08:00`);
        return {
          date,
          weekday: weekdays[day.getDay()],
          day: summary,
          night: probability >= 50 ? `降雨概率${probability}%` : "夜间关注",
          high: Math.round(daily.temperature_2m_max[index]),
          low: Math.round(daily.temperature_2m_min[index]),
          wind: `最大风速${Math.round(daily.wind_speed_10m_max[index])}km/h`,
        };
      }),
      watchItems,
    };
    await fs.writeFile(outputFile, `${JSON.stringify(weather, null, 2)}\n`, "utf8");
  } catch (error) {
    await fs.writeFile(outputFile, `${JSON.stringify(fallback(existing, error), null, 2)}\n`, "utf8");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
