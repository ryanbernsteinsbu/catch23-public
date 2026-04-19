from pybaseball import batting_stats_range, pitching_stats_range
 
import pandas as pd
import requests

# def get_position(mlb_id): # this is too slow we need to batch
#     url = f"https://statsapi.mlb.com/api/v1/people/{mlb_id}"
#     res = requests.get(url).json()
#     # print(res["people"][0]["primaryPosition"])
#     return res["people"][0]["primaryPosition"]["abbreviation"]

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
    ("Maj-AL", "New York"): "NYY",
    ("Maj-NL", "New York"): "NYM",
    ("Maj-AL", "Los Angeles"): "LAA",
    ("Maj-NL", "Los Angeles"): "LAD",
    ("Maj-NL", "Washington"): "WSN",
    ("Maj-NL", "San Francisco"): "SF",
    ("Maj-NL", "St. Louis"): "STL",
    ("Maj-AL", "Cleveland"): "CLE",
    ("Maj-AL", "Boston"): "BOS",
    ("Maj-AL", "Toronto"): "TOR",
    ("Maj-AL", "Baltimore"): "BAL",
    ("Maj-AL", "Tampa Bay"): "TB",
    ("Maj-AL", "Chicago"): "CWS",
    ("Maj-NL", "Chicago"): "CHC",
    ("Maj-AL", "Detroit"): "DET",
    ("Maj-AL", "Kansas City"): "KC",
    ("Maj-AL", "Minnesota"): "MIN",
    ("Maj-NL", "Atlanta"): "ATL",
    ("Maj-NL", "Miami"): "MIA",
    ("Maj-NL", "Philadelphia"): "PHI",
    ("Maj-NL", "Pittsburgh"): "PIT",
    ("Maj-NL", "Cincinnati"): "CIN",
    ("Maj-NL", "Milwaukee"): "MIL",
    ("Maj-NL", "Arizona"): "ARI",
    ("Maj-NL", "Colorado"): "COL",
    ("Maj-AL", "Houston"): "HOU",
    ("Maj-AL", "Seattle"): "SEA",
    ("Maj-AL", "Oakland"): "OAK",
    ("Maj-AL", "Texas"): "TEX",
}
# returned stats for ref
# lastYearStats: { AB,R,H,"1B":_1B,"2B":_2B,"3B":_3B,HR,RBI,BB,K,SB,CS,AVG,OBP,SLG,FPTS },
    # Index(['Name', 'Age', '#days', 'Lev', 'Tm', 'G', 'PA', 'AB', 'R', 'H', '2B',
    #        '3B', 'HR', 'RBI', 'BB', 'IBB', 'SO', 'HBP', 'SH', 'SF', 'GDP', 'SB',
    #        'CS', 'BA', 'OBP', 'SLG', 'OPS', 'mlbID'],
data = batting_stats_range(start_dt="2023-04-01", end_dt="2026-04-11") # grab stats, TODO make this range dynamic (it will break if times are offseason)
data.rename({ "SO": "K", "BA": "AVG" }, axis="columns", inplace=True) # match existing labels
data["1B"] = data["H"] - data["2B"] - data["3B"] - data["HR"] # add existing label
#names contain escape codes
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
# final_data["position"] = final_data["mlbID"].apply(get_position)

final_data["team_abbr"] = final_data.apply(# get team
    lambda row: TEAM_MAP.get((row["Lev"], row["Tm"]), None),
    axis=1
)

final_data.to_csv(r'./data.csv', index=False) #save

# Index(['Name', 'Age', '#days', 'Lev', 'Date', 'Tm', ' ', 'Opp', 'G', 'GS', 'W',
#        'L', 'SV', 'IP', 'H', 'R', 'ER', 'BB', 'SO', 'HR', 'HBP', 'ERA', 'GSc',
#        'AB', '2B', '3B', 'IBB', 'GDP', 'SF', 'SB', 'CS', 'PO', 'BF', 'Pit',
#        'Str', 'StL', 'StS', 'GB/FB', 'LD', 'PU', 'WHIP', 'BAbip', 'SO9',
#        'SO/W', 'mlbID'],

#pitching stats reference ^^
pitching_data = pitching_stats_range(start_dt="2023-04-01", end_dt="2026-04-11")

# pitching_data["Name"] = pitching_data["Name"].apply( # was my attempt to parse names TODO 
#     lambda x : x.encode("latin1").decode("utf-8")
# )
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
final_pitching_data.to_csv(r'./pdata.csv', index=False)
# print(pitching_data)


