import fetch from "node-fetch";
import fs from "fs";
import moment from "moment";

console.log("Fetching Vaccine Start");
const dir = "./build/vaccine/";
const file = "index.json";

// Empty Json, gets filled and written to disk
const finalJson = {
  states: [],
};

const endpoint = "https://rki-vaccination-data.vercel.app/api";
const endpointMorgenpost =
  "https://interaktiv.morgenpost.de/data/corona/rki-vaccinations.json";

// fetch data from api, and iterate over states
fetch(endpoint)
  .then((res) => res.json())
  .then(async (_json) => {
    // console.log(_json);
    let germanyMorgenpost;
    await fetch(endpointMorgenpost)
      .then((res) => res.json())
      .then(async (_jsonMp) => {
        germanyMorgenpost = _jsonMp.find((item) => item.id == "de");
      }).catch((error) => {
        console.log(
          "\x1b[31m%s\x1b[0m",
          ` x Error fetching handleData: fetch(endpointMorgenpost)`
        );
        console.log(error);
        throw new Error("x Error fetching handleData: fetch(endpointMorgenpost)");
      });

    // for (const key in user) {
    for (const state in _json.states) {
      // console.log(`${state}: ${_json.states[state]}`);
      finalJson.states.push({
        name: state,
        total: _json.states[state].total,
        rs: _json.states[state].rs,
        vaccinated:
          _json.states[state].vaccinated +
          _json.states[state]["2nd_vaccination"].vaccinated,
        difference_to_the_previous_day:
          _json.states[state].difference_to_the_previous_day,
      });
    }

    finalJson.last_update = moment(_json.lastUpdate).format("DD.MM., HH:mm");
    finalJson.germany = {
      total: _json.total,
      sum_vaccine_doses: _json.sum_vaccine_doses,
      difference_to_the_previous_day: _json.difference_to_the_previous_day,
      cumsum_7_days_ago: germanyMorgenpost.cumsum_7_days_ago,
    };
    // console.log(finalJson);

    if (!fs.existsSync(dir)) {
      fs.mkdir(dir, { recursive: true }, (err) => {
        if (err) throw err;
      });
    }

    fs.writeFileSync(`${dir}${file}`, JSON.stringify(finalJson));
    console.log(
      "\x1b[42m\x1b[30m%s\x1b[0m",
      ` ✔  Datei gespeichert: ${dir}${file}`
    );
  })
  .catch((error) => {
    console.log("\x1b[31m%s\x1b[0m", ` x Error fetching fetch(endpoint)`);
    console.log(error);
  });
