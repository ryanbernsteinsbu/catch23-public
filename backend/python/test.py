import pandas as pd

# Load the CSV file
df = pd.read_csv("./minordata.csv")

# Get unique values from the "Tm" column
unique_tm_values = df["Tm"].dropna().unique()

# Print them
for value in sorted(unique_tm_values):
    print(value)
