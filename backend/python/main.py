from pybaseball import batting_stats_range, pitching_stats_range

import pandas as pd
import requests
yesterday = "2026-04-11"
PLAYER_MAP_DF = pd.read_csv("playermap.csv", low_memory=False)
valid_rows = PLAYER_MAP_DF[
    PLAYER_MAP_DF["ESPNID"].notna() &
    PLAYER_MAP_DF["MLBID"].notna()
]

ESPN_TO_MLB = dict(
    zip(
        valid_rows["ESPNID"].astype(int).astype(str),
        valid_rows["MLBID"].astype(int)
    )
)
# helpers
def chunk(lst, size=50): #custom iterator reads 50 of list
    for i in range(0, len(lst), size):
        yield lst[i:i+size]

def get_positions_batch(ids): #batch call for all chunk ids
    url = "https://statsapi.mlb.com/api/v1/people"
    res = requests.get(url, params={"personIds": ",".join(map(str, ids))})
    data = res.json()

    return {
        p["id"]: p["primaryPosition"]["abbreviation"]
        for p in data["people"]
    } # return a map of the results

TEAM_MAP = { #results dont show team so I used AI to make this map
    ("Maj-AL", "Baltimore"): "BAL",
    ("Maj-AL", "Boston"): "BOS",
    ("Maj-AL", "Los Angeles"): "LAA",
    ("Maj-AL", "Chicago"): "CHW",
    ("Maj-AL", "Cleveland"): "CLE",
    ("Maj-AL", "Detroit"): "DET",
    ("Maj-AL", "Kansas City"): "KC",
    ("Maj-NL", "Milwaukee"): "MIL",
    ("Maj-AL", "Minnesota"): "MIN",
    ("Maj-AL", "New York"): "NYY",
    ("Maj-AL", "Athletics"): "ATH",
    ("Maj-AL", "Seattle"): "SEA",
    ("Maj-AL", "Texas"): "TEX",
    ("Maj-AL", "Toronto"): "TOR",
    ("Maj-NL", "Atlanta"): "ATL",
    ("Maj-NL", "Chicago"): "CHC",
    ("Maj-NL", "Cincinnati"): "CIN",
    ("Maj-AL", "Houston"): "HOU",
    ("Maj-NL", "Los Angeles"): "LAD",
    ("Maj-NL", "Washington"): "WSH",
    ("Maj-NL", "New York"): "NYM",
    ("Maj-NL", "Philadelphia"): "PHI",
    ("Maj-NL", "Pittsburgh"): "PIT",
    ("Maj-NL", "St. Louis"): "STL",
    ("Maj-NL", "San Diego"): "SD",
    ("Maj-NL", "San Francisco"): "SF",
    ("Maj-NL", "Colorado"): "COL",
    ("Maj-NL", "Miami"): "MIA",
    ("Maj-NL", "Arizona"): "ARI",
    ("Maj-AL", "Tampa Bay"): "TB",
}

depthchart = {}
teamchart = {}
BASE_URL = "https://sports.core.api.espn.com/v2/sports/baseball/leagues/mlb/seasons/2026/teams/{}/depthcharts?lang=en&region=us"
ROLES = ["rp", "p", "c", "1b", "2b", "3b", "ss", "lf", "cf", "rf", "dh", "cl"]

def fill_depth_chart():
    for team in range(1, 31):  #TEAM_MAP.values():
        # print(list(TEAM_MAP.values())[team - 1]) 
        url = BASE_URL.format(team)

        try:
            response = requests.get(url)
            response.raise_for_status()  # raises error if bad status

            data = response.json()
            items = data["items"][0]["positions"]
            for role in ROLES:
                try:
                    items[role]
                except:
                    print(team)

                for player in items[role]["athletes"]:
                    ref = player["athlete"]["$ref"]

                    athlete_id = ref.split("/")[-1].split("?")[0]

                    # athlete_data = requests.get(f"https://sports.core.api.espn.com/v2/sports/baseball/leagues/mlb/seasons/2026/athletes/{athlete_id}?lang=en&region=us")
                    # athlete_data.raise_for_status()
                    # athlete_data = athlete_data.json()
                    # print(athlete_data["fullName"])

                    rank = player["rank"]
                    depthchart[athlete_id] = f"{rank} {role}"
                    teamchart[athlete_id] = list(TEAM_MAP.values())[team - 1]
        except requests.RequestException as e:
            print(f"Failed {team}: {e}")
        # print(team)

fill_depth_chart()

def map_espn_to_mlb(input_dict):
    return {
        ESPN_TO_MLB[str(espn_id)]: value
        for espn_id, value in input_dict.items()
        if str(espn_id) in ESPN_TO_MLB
    }

mlb_depth = map_espn_to_mlb(depthchart)
mlb_teams = map_espn_to_mlb(teamchart)
# print(teamchart["4990055"])
# print(ESPN_TO_MLB)
# print(mlb_teams["677800"])

# lastYearStats: { AB,R,H,"1B":_1B,"2B":_2B,"3B":_3B,HR,RBI,BB,K,SB,CS,AVG,OBP,SLG,FPTS },
    # Index(['Name', 'Age', '#days', 'Lev', 'Tm', 'G', 'PA', 'AB', 'R', 'H', '2B',
    #        '3B', 'HR', 'RBI', 'BB', 'IBB', 'SO', 'HBP', 'SH', 'SF', 'GDP', 'SB',
    #        'CS', 'BA', 'OBP', 'SLG', 'OPS', 'mlbID'],
def get_batting_stats(start_dt, end_dt, filename=r"./data.csv"):
    data = batting_stats_range(start_dt=start_dt, end_dt=end_dt) # grab stats, TODO make this range dynamic (it will break if times are offseason)
    data.rename({ "SO": "K", "BA": "AVG" }, axis="columns", inplace=True) # match existing labels
    data["1B"] = data["H"] - data["2B"] - data["3B"] - data["HR"] # add existing label

    final_data = data[ # get required fields
        [
            "Name", "Age", "mlbID", "Lev","Tm", "Age", "PA",
            "AB", "R", "H", "1B", "2B", "3B", "HR",
            "RBI", "BB", "K", "SB", "CS",
            "AVG", "OBP", "SLG"
        ]
    ]
    positions = {}

    for batch in chunk(final_data["mlbID"].tolist(), 50):
        positions.update(get_positions_batch(batch))

    final_data["position"] = final_data["mlbID"].map(positions) # grab positions
    # print(final_data["position"].unique())
    final_data["team_abbr"] = final_data.apply(# get team
        lambda row: TEAM_MAP.get((row["Lev"], row["Tm"]), None),
        axis=1
    )
    final_data["depth"] = final_data["mlbID"].map(mlb_depth)
    final_data["team_abbr"] = final_data["mlbID"].map(mlb_teams)

    final_data.to_csv(filename, index=False) #save

# Index(['Name', 'Age', '#days', 'Lev', 'Date', 'Tm', ' ', 'Opp', 'G', 'GS', 'W',
#        'L', 'SV', 'IP', 'H', 'R', 'ER', 'BB', 'SO', 'HR', 'HBP', 'ERA', 'GSc',
#        'AB', '2B', '3B', 'IBB', 'GDP', 'SF', 'SB', 'CS', 'PO', 'BF', 'Pit',
#        'Str', 'StL', 'StS', 'GB/FB', 'LD', 'PU', 'WHIP', 'BAbip', 'SO9',
#        'SO/W', 'mlbID'],

#pitching stats reference ^^
def get_pitching_stats(start_dt, end_dt, filename=r"./pdata.csv"):
    pitching_data = pitching_stats_range(start_dt=start_dt, end_dt=end_dt)

    final_pitching_data = pitching_data[
        [
            "Name", "Age", "mlbID", "Lev","Tm", "Age", "G",
            "GS", "W", "SV", "IP", "H", "ER",
            "BB", "SO", "HR", "ERA", "WHIP",
            "BF", "SO/W", "SB", "PO"
        ]
    ]

    final_pitching_data["team_abbr"] = final_pitching_data.apply(
        lambda row: TEAM_MAP.get((row["Lev"], row["Tm"]), None),
        axis=1
    )
    final_pitching_data["depth"] = final_pitching_data["mlbID"].map(mlb_depth)
    final_pitching_data["team_abbr"] = final_pitching_data["mlbID"].map(mlb_teams)
    final_pitching_data.to_csv(filename, index=False)

get_batting_stats('2025-03-18', '2025-11-01', r"./rsrc/batting_last.csv")
get_batting_stats('2023-04-01',  '2025-11-01', r"./rsrc/batting_3avg.csv")
get_pitching_stats('2025-03-18', '2025-11-01', r"./rsrc/pitching_last.csv")
get_pitching_stats('2023-04-01',  '2025-11-01', r"./rsrc/pitching_3avg.csv")


