import requests
import pandas as pd
from bs4 import BeautifulSoup
team_leagues = {
    "ARI": "Maj-NL",
    "ATL": "Maj-NL",
    "BAL": "Maj-AL",
    "BOS": "Maj-AL",
    "CHC": "Maj-NL",
    "CHW": "Maj-AL",
    "CIN": "Maj-NL",
    "CLE": "Maj-AL",
    "COL": "Maj-NL",
    "DET": "Maj-AL",
    "HOU": "Maj-AL",
    "KCR": "Maj-AL",
    "LAA": "Maj-AL",
    "LAD": "Maj-NL",
    "MIA": "Maj-NL",
    "MIL": "Maj-NL",
    "MIN": "Maj-AL",
    "NYM": "Maj-NL",
    "NYY": "Maj-AL",
    "OAK": "Maj-AL",
    "PHI": "Maj-NL",
    "PIT": "Maj-NL",
    "SDP": "Maj-NL",
    "SEA": "Maj-AL",
    "SFG": "Maj-NL",
    "STL": "Maj-NL",
    "TBR": "Maj-AL",
    "TEX": "Maj-AL",
    "TOR": "Maj-AL",
    "WSN": "Maj-NL",
}
def clean_name(html_name):
    return BeautifulSoup(html_name, "html.parser").text


def parse_age(age_str):
    # "33-33" 33
    if isinstance(age_str, str) and "-" in age_str:
        return int(age_str.split("-")[0])
    return age_str


def transform_player(p):
    return {
            "Name": repr(clean_name(p.get("Name")).encode("utf-8"))[2:-1],
        "Age": parse_age(p.get("MaxAge", p.get("Age"))),

        # IDs
        "mlbID": p.get("xMLBAMID"),

        # Level + team
        "Tm": "minors",
        "Lev":  team_leagues[p.get('AffAbbName')],
        "team_abbr": f"{p.get('AffAbbName')} ({p.get('aLevel')})",

        # hitting stats
        "PA": p.get("PA"),
        "AB": p.get("AB"),
        "R": p.get("R"),
        "H": p.get("H"),
        "1B": p.get("1B"),
        "2B": p.get("2B"),
        "3B": p.get("3B"),
        "HR": p.get("HR"),
        "RBI": p.get("RBI"),
        "BB": p.get("BB"),
        "K": p.get("SO"),
        "SB": p.get("SB"),
        "CS": p.get("CS"),

        # rate stats
        "AVG": p.get("AVG"),
        "OBP": p.get("OBP"),
        "SLG": p.get("SLG"),

        # extras
        "position": p.get("positionDB"),
        "depth": ""
    }


def transform_pitcher(p):
    return {
            "Name": repr(clean_name(p.get("Name")).encode("utf-8"))[2:-1],
        "Age": parse_age(p.get("MaxAge", p.get("Age"))),

        # IDs
        "mlbID": p.get("xMLBAMID"),

        # Level + team
        "Lev":  team_leagues[p.get('AffAbbName')],
        "Tm":  "minors",
        "team_abbr": f"{p.get('AffAbbName')} ({p.get('aLevel')})",

        # pitching stats
        "G": p.get("G"),
        "GS": p.get("GS"),
        "W": p.get("W"),
        "SV": p.get("SV"),
        "IP": p.get("IP"),
        "H": p.get("H"),
        "ER": p.get("ER"),
        "BB": p.get("BB%"),
        "SO": p.get("SO"),
        "HR": p.get("HR"),
        "ERA": p.get("ERA"),
        "WHIP": p.get("WHIP"),
        "BF": p.get("BF"),
        "SO/W": p.get("SO/W"),
        "SB": p.get("SB"),
        "PO": p.get("PO"),

        # extras
        "position": p.get("positionDB"),
        "depth": ""
    }

COUNT_STATS = {
    "Age", "PA", "AB", "R", "H", "1B", "2B", "3B", "HR",
    "RBI", "BB", "K", "SB", "CS",
    "G", "GS", "W", "SV", "ER", "SO", "BF", "PO"
}

RATE_STATS = {
    "AVG", "OBP", "SLG", "ERA", "WHIP", "SO/W"
}


def format_dataframe(df):
    for col in df.columns:
        if col in COUNT_STATS:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

        elif col in RATE_STATS:
            df[col] = pd.to_numeric(df[col], errors="coerce").round(3)

    return df

def to_dataframe(api_data, is_bat):
    cleaned = [(transform_player(p) if is_bat else transform_pitcher(p)) for p in api_data]

    return format_dataframe(pd.DataFrame(cleaned))

BASE_URL = "https://www.fangraphs.com/api/leaders/minor-league/data?pos=all&level=0&lg=2,4,5,6,7,8,9,10,11,14,12,13,15,16,17,18,30,32&stats={is_bat}&qual=y&type=0&team=&season={start_dt}&seasonEnd={end_dt}&org=&ind=0&splitTeam=false"


def get_minor_stats(is_bat, start_dt, end_dt):
    url = BASE_URL.format(is_bat = ("bat" if is_bat else "pit"), start_dt=start_dt, end_dt=end_dt)
    try:
        response = requests.get(url)
        response.raise_for_status()  # raises error if bad status

        data = response.json()

        df = to_dataframe(data, is_bat)

        df.to_csv((r"./rsrc/minordata.csv" if is_bat else r"./rsrc/minorpdata.csv"), index=False)
    except requests.RequestException as e:
        print(f"Failed : {e}")

get_minor_stats(True, 2025, 2026)
get_minor_stats(False, 2025, 2026)
