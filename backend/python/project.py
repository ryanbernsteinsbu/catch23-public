import pandas as pd

HITTER_COUNT_STATS = [
    "PA", "AB", "R", "H", "1B", "2B", "3B",
    "HR", "RBI", "BB", "K", "SB", "CS"
]

HITTER_RATE_STATS = [
    "AVG", "OBP", "SLG"
]

PITCHER_COUNT_STATS = [
    "G", "GS", "W", "SV", "IP", "H",
    "ER", "BB", "SO", "HR", "BF",
    "SB", "PO"
]

PITCHER_RATE_STATS = [
    "ERA", "WHIP", "SO/W"
]


def generate_projections( last_df, three_year_df, count_stats, rate_stats, output_path):

    df = last_df.merge(
        three_year_df,
        on="mlbID",
        suffixes=("_last", "_3yr")
    )

    projected_df = last_df.copy()

    for stat in count_stats:
        try:
            projected_df[stat] = ( 2 * df[f"{stat}_last"] - (df[f"{stat}_3yr"] / 3)).clip(lower=0)

            if stat == "IP":
                projected_df[stat] = ( projected_df[stat].round(1))
            else:
                try:
                    projected_df[stat] = ( projected_df[stat].round().astype(int))
                except:
                    projected_df[stat] = 0

        except KeyError:
            pass

    for stat in rate_stats:
        try:
            projected_df[stat] = ( 2 * df[f"{stat}_last"] - df[f"{stat}_3yr"]).clip(lower=0)

            projected_df[stat] = ( projected_df[stat] .round(3))

        except KeyError:
            pass

    if "AVG" in projected_df.columns:
        projected_df["AVG"] = projected_df["AVG"].clip(0, 0.450)
    if "OBP" in projected_df.columns:
        projected_df["OBP"] = projected_df["OBP"].clip(0, 0.550)
    if "SLG" in projected_df.columns:
        projected_df["SLG"] = projected_df["SLG"].clip(0, 0.900)
    if "ERA" in projected_df.columns:
        projected_df["ERA"] = projected_df["ERA"].clip(0, 15)
    if "WHIP" in projected_df.columns:
        projected_df["WHIP"] = projected_df["WHIP"].clip(0, 3)

    projected_df.to_csv(output_path, index=False)

    return projected_df

last_hitters_df = pd.read_csv("./rsrc/batting_last.csv")
three_year_hitters_df = pd.read_csv("./rsrc/batting_3avg.csv")
last_pitchers_df = pd.read_csv("./rsrc/pitching_last.csv")
three_year_pitchers_df = pd.read_csv("./rsrc/pitching_3avg.csv")


projected_hitters = generate_projections(
    last_hitters_df,
    three_year_hitters_df,
    HITTER_COUNT_STATS,
    HITTER_RATE_STATS,
    "./rsrc/projected_hitters.csv"
)
projected_pitchers = generate_projections(
    last_pitchers_df,
    three_year_pitchers_df,
    PITCHER_COUNT_STATS,
    PITCHER_RATE_STATS,
    "./rsrc/projected_pitchers.csv"
)
