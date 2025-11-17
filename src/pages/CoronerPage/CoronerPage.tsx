import React from "react";
import { Box, Container, Typography, Card, CardContent } from "@mui/material";
import {
  color_primary,
  color_secondary,
  header_height,
  header_mobile_height,
} from "../../constants/colors";

const CoronerPage = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f9f9f9", // clean neutral background
        pt: { xs: `calc(${header_mobile_height} + 2rem)`, md: `calc(${header_height} + 2rem)` },
        pb: 6,
      }}
    >
      <Container maxWidth="lg">
        {/* Page Title */}
        <Typography
          variant="h3"
          align="center"
          sx={{
            fontWeight: 700,
            mb: 4,
            color: color_primary,
          }}
        >
          Office of the Chief Coroner for Ontario
        </Typography>

        {/* Content Card */}
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            backgroundColor: "white",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 6 } }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 600, color: color_secondary }}
            >
              Residential Schools Death Investigation Team (RSDIT)
            </Typography>

            <Typography paragraph>
              All investigations of former Indian Residential Schools in Ontario are
              Survivor and community led. All the information learned by the team is
              shared with the lead First Nation community. This information assists
              with realizing the Truth and Reconciliation Commission (TRC) Calls to
              Action #71, 72, and 74.
            </Typography>

            <Typography
              variant="h6"
              sx={{ mt: 3, mb: 1, color: color_primary }}
            >
              Background
            </Typography>
            <Typography paragraph>
              In 2022, Dr. Dirk Huyer, the Chief Coroner for Ontario established the
              Residential Schools Death Investigation Team (RSDIT) to assist with these
              investigations. The team is comprised of experienced police criminal
              investigators and a police analyst working under the direction of the
              Chief Coroner. The team takes an investigative approach, obtaining and
              reviewing records to determine who died, when and where they died, where
              they are buried, and the manner and cause of each death (the medical cause
              of death and the circumstances surrounding each death.)
            </Typography>
            <Typography paragraph>
              A Coroners Act investigation focuses on answering these questions and is
              precluded from assigning blame or finding fault. Because the RSDIT is
              conducting investigations under Ontario’s Coroners Act, it has the
              statutory authority to access or seize records and documents required to
              answer these questions. The team has arranged for access to federal and
              provincial government records, several restricted databases, and obtains
              documents from other entities (e.g.: church archives) as required.
            </Typography>
            <Typography paragraph>
              When reviewing the findings it can be noted the RSDIT uses a
              <em> follow-the-child </em> approach. This means that once there is an
              indication in the records that a Child is no longer at the IRS and
              information pertaining to the discharge is ambiguous, all available
              avenues are explored to determine what happened to them. Experience
              demonstrates that even after a Child left an IRS, the government (e.g.:
              often the Indian Agent) retained responsibility for decisions.
              Consequently, letters and other documents can often be located confirming
              details of transfers to sanitoriums, hospitals, other institutions
              including fosters homes and child welfare type institutions. The team’s
              approach can be characterized as investigative research, as we do not
              restrict ourselves to documents within a database, rather we determine the
              questions we need to answer then pursue all avenues. For example, we will
              contact funeral homes, churches and cemeteries directly to see if they
              have additional information.
            </Typography>
            <Typography paragraph>
              The RSDIT has no “unknown” deaths as we track every Child we look for,
              typically finding a continuum of documents. For Children we have
              determined are not missing from an IRS, we have used multiple sources to
              determine they lived afterwards including vital statistics (i.e.:
              confirming marriage or death later), the Federal Indian Registry System,
              Statistics Canada (Federal Census), obituaries, etc.
            </Typography>

            <Typography
              variant="h6"
              sx={{ mt: 3, mb: 1, color: color_primary }}
            >
              Most Documents are in the Public Domain
            </Typography>
            <Typography paragraph>
              The team typically commences searching for a Child by accessing publicly
              available documents, including sites such as Ancestry.ca, Findagrave.com,
              Newspapers.com (obituaries). In Ontario all death registrations that are
              more than 70 years old are uploaded to Ancestry.ca. This is typically the
              most efficient and effective way to ascertain what documents are available
              and facilitates sharing these documents with Survivors and communities
              since they are in the public domain.
            </Typography>

            <Typography
              variant="h6"
              sx={{ mt: 3, mb: 1, color: color_primary }}
            >
              Contact Information
            </Typography>
            <Typography paragraph>
              For more information on the Team and Community requests please contact
              the Team Leader:
              <br />
              <strong>Dr. Mark Mackisoc, PhD</strong> –{" "}
              <a href="mailto:mark.mackisoc@ontario.ca">
                mark.mackisoc@ontario.ca
              </a>
            </Typography>
            <Typography paragraph>
              For further information on any Child who went to Shingwauk Indian
              Residential School, especially if they are not on the current list please
              contact the lead investigator for Shingwauk:
              <br />
              <strong>Janna Miller</strong> –{" "}
              <a href="mailto:janna.miller@ontario.ca">janna.miller@ontario.ca</a>
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mt: 4,
                fontStyle: "italic",
                textAlign: "center",
                color: color_secondary,
              }}
            >
              “We ensure no death goes overlooked, ignored or concealed”
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default CoronerPage;