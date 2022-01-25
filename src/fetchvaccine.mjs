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

const endpoint = "https://rki-vaccination-data.vercel.app/api/v2/";

// fetch data from api, and iterate over states
fetch(endpoint)
  .then((res) => res.json())
  .then(async (_json) => {

      _json.data.forEach(state => {
        // console.log(state);
        if (state.name === "Deutschland") {
          finalJson.germany = {
            total: state.inhabitants,
            sum_vaccine_doses: 
            state.fullyVaccinated.doses*2,
            difference_to_the_previous_day: state.fullyVaccinated.differenceToThePreviousDay,
            cumsum_7_days_ago: state.fullyVaccinated.differenceToThePreviousDay*7,
          };
        }
        if (!state.isState) {
          return false;
        }
        finalJson.states.push({
          name: state.name,
          total: state.inhabitants,
          rs: state.rs,
          vaccinated:
            state.fullyVaccinated.doses,
          difference_to_the_previous_day:
          state.fullyVaccinated.differenceToThePreviousDay,
        });
      }); 
    

    finalJson.last_update = moment(_json.lastUpdate).format("DD.MM., HH:mm");

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
