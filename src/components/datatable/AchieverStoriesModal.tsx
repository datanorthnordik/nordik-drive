import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export interface AchieverStory {
  id: number;
  story_type: "document" | "text" | "video" | string;
  story_text?: string;
  video_url?: string;
  file_name?: string;
  content_type?: string;
  achiever_story_identified?: string;
  google_details?: string;
  newspapers_details?: string;
  ancestry_details?: string;
  derivation_sources?: string[];
}

interface AchieverStoriesModalProps {
  open: boolean;
  onClose: () => void;
  stories: AchieverStory[];
  onViewDocument: (story: AchieverStory) => void;
}

const sourceDetails = (story: AchieverStory) => [
  ["Achiever Story Identified", story.achiever_story_identified],
  ["Google", story.google_details],
  ["Newspapers.com", story.newspapers_details],
  ["Ancestry", story.ancestry_details],
] as const;

const storyTitle = (story: AchieverStory, index: number) => {
  if (story.story_type === "document") return story.file_name || `Story document ${index + 1}`;
  if (story.story_type === "video") return `Story video ${index + 1}`;
  return `Story ${index + 1}`;
};

const AchieverStoriesModal: React.FC<AchieverStoriesModalProps> = ({
  open,
  onClose,
  stories,
  onViewDocument,
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle>Achiever Stories</DialogTitle>
    <DialogContent dividers>
      {!stories.length ? (
        <Typography color="text.secondary">No published achiever stories are available for this person.</Typography>
      ) : (
        <Stack spacing={2}>
          {stories.map((story, index) => (
            <Paper key={story.id} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.25}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {storyTitle(story, index)}
                </Typography>

                {story.story_type === "document" && (
                  <Box>
                    <Button variant="contained" size="small" onClick={() => onViewDocument(story)}>
                      View PDF
                    </Button>
                  </Box>
                )}

                {story.story_type === "text" && story.story_text && (
                  <Typography component="div" sx={{ whiteSpace: "pre-wrap" }}>
                    {story.story_text}
                  </Typography>
                )}

                {story.story_type === "video" && story.video_url && (
                  <Link href={story.video_url} target="_blank" rel="noopener noreferrer">
                    Watch story video
                  </Link>
                )}

                {sourceDetails(story).some(([, value]) => value) && (
                  <>
                    <Divider />
                    <Stack spacing={0.5}>
                      {sourceDetails(story).map(([label, value]) =>
                        value ? (
                          <Typography key={label} variant="body2" color="text.secondary">
                            <strong>{label}:</strong> {value}
                          </Typography>
                        ) : null
                      )}
                    </Stack>
                  </>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default AchieverStoriesModal;
