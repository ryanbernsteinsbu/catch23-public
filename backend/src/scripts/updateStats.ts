import Player from "../models/player";
import csv from "csv-parser";
import fs from "fs";
import { Op} from "sequelize";

type StatType =
  | "lastYearStats"
  | "threeYearAvg"
  | "projectedStats";

const emptyHitterStats = () => ({
  PA: 0,
  AB: 0,
  R: 0,
  H: 0,
  "1B": 0,
  "2B": 0,
  "3B": 0,
  HR: 0,
  RBI: 0,
  BB: 0,
  K: 0,
  SB: 0,
  CS: 0,
  AVG: 0,
  OBP: 0,
  SLG: 0,
});

const emptyPitcherStats = () => ({
  G: 0,
  GS: 0,
  W: 0,
  SV: 0,
  IP: 0,
  H: 0,
  ER: 0,
  BB: 0,
  SO: 0,
  HR: 0,
  ERA: 0,
  WHIP: 0,
  BF: 0,
  "SO/W": 0,
  SB: 0,
  PO: 0,
});

const buildHitterStats = ( row: any, divideBy = 1) => {
  if (!row) return emptyHitterStats();

  return {
    PA: row.PA / divideBy,
    AB: row.AB / divideBy,
    R: row.R / divideBy,
    H: row.H / divideBy,
    "1B": row["1B"] / divideBy,
    "2B": row["2B"] / divideBy,
    "3B": row["3B"] / divideBy,
    HR: row.HR / divideBy,
    RBI: row.RBI / divideBy,
    BB: row.BB / divideBy,
    K: row.K / divideBy,
    SB: row.SB / divideBy,
    CS: row.CS / divideBy,

    // rate stats should NOT be divided
    AVG: row.AVG,
    OBP: row.OBP,
    SLG: row.SLG,
  };
};

const buildPitcherStats = (
  row: any,
  divideBy = 1
) => {
  if (!row) return emptyPitcherStats();

  return {
    G: row.G / divideBy,
    GS: row.GS / divideBy,
    W: row.W / divideBy,
    SV: row.SV / divideBy,
    IP: row.IP / divideBy,
    H: row.H / divideBy,
    ER: row.ER / divideBy,
    BB: row.BB / divideBy,
    SO: row.SO / divideBy,
    HR: row.HR / divideBy,
    BF: row.BF / divideBy,
    SB: row.SB / divideBy,
    PO: row.PO / divideBy,

    // rate stats should NOT be divided
    ERA: row.ERA,
    WHIP: row.WHIP,
    "SO/W": row["SO/W"],
  };
};

async function loadCsvIntoMap(
  csvPath: string
): Promise<Map<number, any>> {
  return new Promise((resolve, reject) => {
    const map = new Map<number, any>();

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        try {
          const mlbId = Number(row.mlbID);

          if (!mlbId) return;

          map.set(mlbId, row);
        } catch (err) {}
      })
      .on("end", () => resolve(map))
      .on("error", reject);
  });
}

async function updateStatsFromCsv(
  csvPath: string,
  statType: StatType,
  isHitter: boolean
) {
  const statMap = await loadCsvIntoMap(csvPath);

  const players = await Player.findAll({
    where: {
      isHitter,
      status: { [Op.ne]: "MINORS" }
    },
  });

  console.log(
    `Updating ${players.length} players (${statType})`
  );

  for (const player of players) {
    try {
      const row = statMap.get(
        Number(player.mlbPlayerId)
      );

      let stats;

      const divideBy = statType === "threeYearAvg" ? 3 : 1; 
      
      if (isHitter) {
        stats = buildHitterStats(
          row,
          divideBy
        );
      } else {
        stats = buildPitcherStats(
          row,
          divideBy
        );
      }

      player[statType] = stats;

      await player.save();

      // console.log(
      //   `Updated ${player.firstName} ${player.lastName}`
      // );
    } catch (err) {
      console.error(
        `Failed updating ${player.firstName} ${player.lastName}`,
        err
      );
    }
  }

  console.log(`Finished ${statType}`);
}


async function run() {
  await updateStatsFromCsv(
    "./python/rsrc/batting_3avg.csv",
    "threeYearAvg",
    true
  );

  await updateStatsFromCsv(
    "./python/rsrc/projected_hitters.csv",
    "projectedStats",
    true
  );
  await updateStatsFromCsv(
    "./python/rsrc/batting_last.csv",
    "lastYearStats",
    true
  );

  // Pitchers
  await updateStatsFromCsv(
    "./python/rsrc/pitching_3avg.csv",
    "threeYearAvg",
    false
  );

  await updateStatsFromCsv(
    "./python/rsrc/projected_pitchers.csv",
    "projectedStats",
    false
  );
  await updateStatsFromCsv(
    "./python/rsrc/pitching_last.csv",
    "lastYearStats",
    false
  );

  console.log("All stat updates complete");
}

run().catch(console.error);
