'use client';
import React, { useMemo } from "react";
import { 
  AllCommunityModule, 
  ModuleRegistry, 
  colorSchemeDarkBlue, 
  colorSchemeDarkWarm, 
  colorSchemeLightCold, 
  colorSchemeLightWarm, 
  themeQuartz 
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { GridWrapper } from "../Wrappers";

ModuleRegistry.registerModules([AllCommunityModule]);

const themeLightWarm = themeQuartz.withPart(colorSchemeLightWarm);


const rowData: any[] = [
    {
        "Last Names": "Wesley",
        "First Names": "Thomas",
        "First Nation/Home": "Moose Cree First Nation",
        "Parents Names": "David & Sarah",
        "Siblings": "Mary, Joseph",
        "Date of Birth": -872294400000,
        "Admitted": -673056000000,
        "Age": 6,
        "Discharged": -427075200000,
        "No.": 1001,
        "Additional Information": "Speaks Cree and some English.",
        "Notes": "Excelled in woodworking class.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Blackbird",
        "First Names": "Annie",
        "First Nation/Home": "Walpole Island First Nation",
        "Parents Names": "Joseph & Catherine",
        "Siblings": "Elijah",
        "Date of Birth": -783907200000,
        "Admitted": -574819200000,
        "Age": 6,
        "Discharged": -498960000000,
        "No.": 1002,
        "Additional Information": "Family lives off-reserve in winter.",
        "Notes": "Was often ill during the first year.",
        "Deceased?": "Yes",
        "Death details": "Died of pneumonia, 1954-03-11"
    },
    {
        "Last Names": "Solomon",
        "First Names": "Eli",
        "First Nation/Home": "Garden River First Nation",
        "Parents Names": "William & Margaret",
        "Siblings": "None known",
        "Date of Birth": -951523200000,
        "Admitted": -704851200000,
        "Age": 7,
        "Discharged": -457401600000,
        "No.": 1003,
        "Additional Information": "Transferred from St. Joseph's School.",
        "Notes": "Quiet, good artist.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Fontaine",
        "First Names": "Marie",
        "First Nation/Home": "Sagkeeng First Nation",
        "Parents Names": "Peter & Anne",
        "Siblings": "Jean, Louise, Henri",
        "Date of Birth": -692668800000,
        "Admitted": -516067200000,
        "Age": 5,
        "Discharged": -237945600000,
        "No.": 1004,
        "Additional Information": "Fluent in French and Anishinaabemowin.",
        "Notes": "Worked in the laundry.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Kakegamic",
        "First Names": "Charlie",
        "First Nation/Home": "Sandy Lake First Nation",
        "Parents Names": "Adam & Maggie",
        "Siblings": "Susan",
        "Date of Birth": -741571200000,
        "Admitted": -546220800000,
        "Age": 6,
        "Discharged": -534643200000,
        "No.": 1005,
        "Additional Information": "Father is a trapper.",
        "Notes": "Suffered from frostbite on arrival.",
        "Deceased?": "Yes",
        "Death details": "Died of tuberculosis, 1953-01-22"
    },
    {
        "Last Names": "Atleo",
        "First Names": "David",
        "First Nation/Home": "Ahousaht First Nation",
        "Parents Names": "Paul & Grace",
        "Siblings": "Three older brothers",
        "Date of Birth": -608860800000,
        "Admitted": -386640000000,
        "Age": 7,
        "Discharged": -142646400000,
        "No.": 1006,
        "Additional Information": "Arrived with cousin (entry #1007).",
        "Notes": "Very athletic, played hockey.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Atleo",
        "First Names": "Sarah",
        "First Nation/Home": "Ahousaht First Nation",
        "Parents Names": "John & Elsie",
        "Siblings": "David (cousin)",
        "Date of Birth": -593568000000,
        "Admitted": -386640000000,
        "Age": 6,
        "Discharged": -111196800000,
        "No.": 1007,
        "Additional Information": "Family works in fishing industry.",
        "Notes": "Good singer, part of the choir.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Linklater",
        "First Names": "William",
        "First Nation/Home": "Timmins, ON",
        "Parents Names": "Robert & Mary",
        "Siblings": "Elizabeth",
        "Date of Birth": -802137600000,
        "Admitted": -609811200000,
        "Age": 6,
        "Discharged": -361843200000,
        "No.": 1008,
        "Additional Information": "Mother is of Scottish descent.",
        "Notes": "Strong student in mathematics.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Fox",
        "First Names": "Catherine",
        "First Nation/Home": "Wikwemikong Unceded Territory",
        "Parents Names": "Benjamin & Agnes",
        "Siblings": "5 siblings on-reserve",
        "Date of Birth": -710985600000,
        "Admitted": -483840000000,
        "Age": 7,
        "Discharged": null,
        "No.": 1009,
        "Additional Information": "Arrived with severe malnourishment.",
        "Notes": "Often helped with younger children.",
        "Deceased?": "Yes",
        "Death details": "Died of influenza, 1955-11-30"
    },
    {
        "Last Names": "McLeod",
        "First Names": "George",
        "First Nation/Home": "Membertou First Nation",
        "Parents Names": "Donald & Flora",
        "Siblings": "Ian, Margaret",
        "Date of Birth": -843523200000,
        "Admitted": -640742400000,
        "Age": 6,
        "Discharged": -612835200000,
        "No.": 1010,
        "Additional Information": "Family requested his return.",
        "Notes": "Stayed only one year.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Carpenter",
        "First Names": "Alice",
        "First Nation/Home": "Alderville First Nation",
        "Parents Names": "Samuel & Eliza",
        "Siblings": "Thomas",
        "Date of Birth": -539222400000,
        "Admitted": -325555200000,
        "Age": 6,
        "Discharged": -48297600000,
        "No.": 1011,
        "Additional Information": "Mother weaves baskets.",
        "Notes": "Excelled at beadwork and sewing.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Sky",
        "First Names": "Joseph",
        "First Nation/Home": "Six Nations of the Grand River",
        "Parents Names": "Jacob & Susan",
        "Siblings": "Daniel",
        "Date of Birth": -638755200000,
        "Admitted": -447120000000,
        "Age": 6,
        "Discharged": -174700800000,
        "No.": 1012,
        "Additional Information": "Speaks Cayuga.",
        "Notes": "Ran away in 1958, returned after 3 days.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Bear",
        "First Names": "Margaret",
        "First Nation/Home": "Muskoday First Nation",
        "Parents Names": "Martin & Therese",
        "Siblings": "Two younger sisters",
        "Date of Birth": -767836800000,
        "Admitted": -542764800000,
        "Age": 7,
        "Discharged": -367545600000,
        "No.": 1013,
        "Additional Information": "Father served in WWII.",
        "Notes": "Worked in the kitchen.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Turtle",
        "First Names": "Peter",
        "First Nation/Home": "Grassy Narrows First Nation",
        "Parents Names": "Simon & Cecile",
        "Siblings": "Unknown",
        "Date of Birth": -724636800000,
        "Admitted": -515203200000,
        "Age": 6,
        "Discharged": null,
        "No.": 1014,
        "Additional Information": "Was found wandering alone.",
        "Notes": "Had difficulty adjusting.",
        "Deceased?": "Yes",
        "Death details": "Accident (drowning), 1954-07-19"
    },
    {
        "Last Names": "Morrisseau",
        "First Names": "Norval",
        "First Nation/Home": "Bingwi Neyaashi Anishinaabek",
        "Parents Names": "Abel & Esther",
        "Siblings": "4 siblings",
        "Date of Birth": -624931200000,
        "Admitted": -420336000000,
        "Age": 6,
        "Discharged": -111283200000,
        "No.": 1015,
        "Additional Information": "Grandfather is a shaman.",
        "Notes": "Constantly drawing on any available scrap.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Paul",
        "First Names": "Agnes",
        "First Nation/Home": "Tobique First Nation",
        "Parents Names": "Noel & Philomena",
        "Siblings": "Marie, Stephen",
        "Date of Birth": -737510400000,
        "Admitted": -512179200000,
        "Age": 7,
        "Discharged": -269136000000,
        "No.": 1016,
        "Additional Information": "Speaks Maliseet.",
        "Notes": "Very protective of her younger sister.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Jourdain",
        "First Names": "Louis",
        "First Nation/Home": "Lac La Croix First Nation",
        "Parents Names": "Francis & Isabelle",
        "Siblings": null,
        "Date of Birth": -791424000000,
        "Admitted": -578102400000,
        "Age": 6,
        "Discharged": -330739200000,
        "No.": 1017,
        "Additional Information": "Family lives a traditional lifestyle.",
        "Notes": "Skilled at hunting and trapping.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Crowfoot",
        "First Names": "John",
        "First Nation/Home": "Siksika Nation",
        "Parents Names": "Matthew & Sarah",
        "Siblings": "Emily",
        "Date of Birth": -524361600000,
        "Admitted": -293414400000,
        "Age": 7,
        "Discharged": -48297600000,
        "No.": 1018,
        "Additional Information": "Great-grandson of a chief.",
        "Notes": "Was a leader among the boys.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Smoke",
        "First Names": "Eliza",
        "First Nation/Home": "Curve Lake First Nation",
        "Parents Names": "George & Charlotte",
        "Siblings": "James, William",
        "Date of Birth": -668217600000,
        "Admitted": -452044800000,
        "Age": 6,
        "Discharged": -206236800000,
        "No.": 1019,
        "Additional Information": "Father is a fishing guide.",
        "Notes": "Struggled with English initially.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Metallic",
        "First Names": "Frank",
        "First Nation/Home": "Listuguj Mi'gmaq First Nation",
        "Parents Names": "Joe & Clara",
        "Siblings": "Susan",
        "Date of Birth": -649036800000,
        "Admitted": -448329600000,
        "Age": 6,
        "Discharged": null,
        "No.": 1020,
        "Additional Information": "Health was poor upon arrival.",
        "Notes": "Was hospitalized for much of his stay.",
        "Deceased?": "Yes",
        "Death details": "Died of scarlet fever, 1956-02-04"
    },
    {
        "Last Names": "Pelletier",
        "First Names": "Cecile",
        "First Nation/Home": "Fort William First Nation",
        "Parents Names": "Antoine & Monique",
        "Siblings": "7 siblings",
        "Date of Birth": -717984000000,
        "Admitted": -483753600000,
        "Age": 7,
        "Discharged": -237945600000,
        "No.": 1021,
        "Additional Information": "Older sister attended same school.",
        "Notes": "Quiet and withdrawn.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Jacobs",
        "First Names": "Noah",
        "First Nation/Home": "Hiawatha First Nation",
        "Parents Names": "Andrew & Rachel",
        "Siblings": "Samuel",
        "Date of Birth": -581731200000,
        "Admitted": -356832000000,
        "Age": 7,
        "Discharged": -79488000000,
        "No.": 1022,
        "Additional Information": "Father works on the railroad.",
        "Notes": "Good at writing, wrote letters for others.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "King",
        "First Names": "Isabel",
        "First Nation/Home": "Mississaugas of the Credit",
        "Parents Names": "David & Martha",
        "Siblings": null,
        "Date of Birth": -750902400000,
        "Admitted": -546307200000,
        "Age": 6,
        "Discharged": -269136000000,
        "No.": 1023,
        "Additional Information": "Family lives near a town.",
        "Notes": "Learned to play the piano.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Kabestra",
        "First Names": "Lucy",
        "First Nation/Home": "Wabaseemoong Independent Nations",
        "Parents Names": "Alexander & Judith",
        "Siblings": "Peter, Mary",
        "Date of Birth": -673228800000,
        "Admitted": -448070400000,
        "Age": 7,
        "Discharged": -401500800000,
        "No.": 1024,
        "Additional Information": "Mother passed away before admission.",
        "Notes": "Suffered from homesickness.",
        "Deceased?": "Yes",
        "Death details": "Undetermined illness, 1957-04-12"
    },
    {
        "Last Names": "Redsky",
        "First Names": "Samuel",
        "First Nation/Home": "Shoal Lake 40 First Nation",
        "Parents Names": "Henry & Anne",
        "Siblings": "3 siblings",
        "Date of Birth": -604022400000,
        "Admitted": -388454400000,
        "Age": 6,
        "Discharged": -111196800000,
        "No.": 1025,
        "Additional Information": "Uncle attended the school in the 1930s.",
        "Notes": "Worked on the farm.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Jacko",
        "First Names": "Bernadette",
        "First Nation/Home": "Chapleau Cree First Nation",
        "Parents Names": "Xavier & Genevieve",
        "Siblings": "Michael, Rose",
        "Date of Birth": -501033600000,
        "Admitted": -294192000000,
        "Age": 6,
        "Discharged": -16848000000,
        "No.": 1026,
        "Additional Information": "Arrived healthy.",
        "Notes": "Known for her storytelling.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Bighetty",
        "First Names": "Philip",
        "First Nation/Home": "Mathias Colomb Cree Nation",
        "Parents Names": "Patrick & Maria",
        "Siblings": "Multiple",
        "Date of Birth": -776044800000,
        "Admitted": -575769600000,
        "Age": 6,
        "Discharged": -299894400000,
        "No.": 1027,
        "Additional Information": "Speaks fluent Cree.",
        "Notes": "Often translated for staff and students.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Young",
        "First Names": "Eleanor",
        "First Nation/Home": "Sault Ste. Marie, ON",
        "Parents Names": "William & Susan",
        "Siblings": "Robert (brother)",
        "Date of Birth": -706752000000,
        "Admitted": -515030400000,
        "Age": 6,
        "Discharged": -237945600000,
        "No.": 1028,
        "Additional Information": "M\u00e9tis family.",
        "Notes": "Read every book in the school library.",
        "Deceased?": "No",
        "Death details": null
    },
    {
        "Last Names": "Martin",
        "First Names": "Daniel",
        "First Nation/Home": "Samson Cree Nation",
        "Parents Names": "Edward & Bella",
        "Siblings": "Sarah",
        "Date of Birth": -654480000000,
        "Admitted": -451440000000,
        "Age": 6,
        "Discharged": -355017600000,
        "No.": 1029,
        "Additional Information": "Transferred to a hospital for treatment.",
        "Notes": "Had a persistent cough.",
        "Deceased?": "Yes",
        "Death details": "Died of tuberculosis, at hospital"
    },
    {
        "Last Names": "George",
        "First Names": "Christine",
        "First Nation/Home": "Kettle and Stony Point First Nation",
        "Parents Names": "Norman & Dorothy",
        "Siblings": "Laura, Timothy",
        "Date of Birth": -542937600000,
        "Admitted": -325555200000,
        "Age": 6,
        "Discharged": -48297600000,
        "No.": 1030,
        "Additional Information": "Father is a carpenter.",
        "Notes": "Was responsible for mending clothes.",
        "Deceased?": "No",
        "Death details": null
    }
]


interface DataGridProps {
    rowData: any[]
}



export default function DataGrid(props: DataGridProps) {
  const {rowData} = props
  const columnDefs = useMemo(() => {
    if (rowData.length === 0) return [];
    return Object.keys(rowData[0]).map(key => ({ field: key }));
}, [rowData]);
const defaultColDef = { editable: true, minWidth: 100, filter: true, cellStyle: { textAlign: 'left' },
  headerClass: 'bold-header'
 };
  return (
    <GridWrapper>
      <div style={{ flex: 1 }} {...themeLightWarm}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={20}         
        />
      </div>
    </GridWrapper>
  );
}
