import axios from 'axios';
import { AudioInfo } from './SunoApi';
import { getSongDetails as getFoxAISongDetails } from './FoxAIService';

const aceDataApiKey = '7f4a7cab6e3b4078b529f2d0e5150a0d';
const aceDataApiUrl = 'https://api.acedata.cloud/suno/audios';
const aceDataTasksUrl = 'https://api.acedata.cloud/suno/tasks';

if (!aceDataApiKey) {
  throw new Error('ACEDATA_API_KEY must be set in environment variables.');
}

export interface AceDataPayload {
  action: 'generate';
  prompt: string;
  callback_url?: string;
  model: string;
  lyric?: string;
  custom: boolean;
  instrumental: boolean;
  title?: string;
  style?: string;
}

async function pollTaskStatus(taskId: string, maxAttempts: number = 40): Promise<any> {
  const headers = {
    'Content-Type': 'application/json',
    'authorization': `Bearer ${aceDataApiKey}`,
  };

  const payload = {
    id: taskId,
    action: 'retrieve'
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.post(aceDataTasksUrl, payload, { headers });
      console.log(`Poll attempt ${attempt + 1} for task ${taskId}:`, response.data);
      
      // Check for stale tasks that haven't produced data after a certain time
      if (response.data?.created_at) {
        const createdAtUtc = new Date(response.data.created_at * 1000).getTime(); // Convert epoch to milliseconds
        const currentTimeUtc = Date.now();
        const THREE_MINUTES_MS = 3 * 60 * 1000;
        
        if (createdAtUtc < (currentTimeUtc - THREE_MINUTES_MS) && (!response.data?.response?.data || response.data.response.data.length === 0)) {
          console.log(`⏰ Task ${taskId} is stale (created ${new Date(createdAtUtc).toISOString()})`);
          return {
            error: 'stale_task',
            message: 'The song generation request has timed out. Please try again.',
            request: response.data.request
          };
        }
      }
      
      // Check for forbidden error in response
      if (response.data?.response?.error?.code === 'forbidden') {
        console.log(`🚫 Forbidden error for task ${taskId}:`, response.data.response.error);
        // Return a special error response that will be handled by getSongDetails
        return {
          error: 'forbidden',
          message: response.data.response.error.message,
          request: response.data.request
        };
      }

      // Check for API timeout error
      if (response.data?.response?.error?.code === 'api_error' && 
          response.data?.response?.error?.message?.includes('timeout')) {
        console.log(`⏰ API timeout error for task ${taskId}:`, response.data.response.error);
        return {
          error: 'api_timeout',
          message: 'The request timed out. The server might be experiencing high load. Please try again.',
          request: response.data.request
        };
      }

      // Check for no free worker error
      if (response.data?.response?.error?.code === 'api_error' && 
          response.data?.response?.error?.message === 'no free worker available') {
        console.log(`👷 No free worker error for task ${taskId}:`, response.data.response.error);
        return {
          error: 'no_worker',
          message: 'All workers are currently busy. The server is experiencing high demand. Please try again in a few minutes.',
          request: response.data.request
        };
      }

      // Check for "Lyrics/Prompts Does Not Meet Guidelines" error
      if (response.data?.response?.error?.code === 'bad_request' && 
          response.data?.response?.error?.message === 'Lyrics/Prompts Does Not Meet Guidelines') {
        console.log(`📝 Lyrics/Prompts error for task ${taskId}:`, response.data.response.error);
        return {
          error: 'lyrics_guidelines',
          message: 'The lyrics or prompts do not meet our content guidelines. Please ensure your content is appropriate and try again.',
          request: response.data.request
        };
      }

      // Check for "Topic too long" error
      if (response.data?.response?.error?.code === 'bad_request' && 
          response.data?.response?.error?.message === 'Topic too long.') {
        console.log(`📏 Topic too long error for task ${taskId}:`, response.data.response.error);
        return {
          error: 'topic_too_long',
          message: 'Input text is too long. Please limit your input to 200 characters.',
          request: response.data.request
        };
      }

      // Check for "Tags too long" error
      if (response.data?.response?.error?.code === 'bad_request' && 
          response.data?.response?.error?.message === 'Tags too long.') {
        console.log(`🏷️ Tags too long error for task ${taskId}:`, response.data.response.error);
        return {
          error: 'tags_too_long',
          message: 'Style description is too long. Please use a shorter description for the music style.',
          request: response.data.request
        };
      }

      // Default error handler for any other error with code and message
      if (response.data?.response?.error?.code && response.data?.response?.error?.message) {
        console.log(`❌ Unhandled API error for task ${taskId}:`, response.data.response.error);
        return {
          error: 'api_error',
          message: response.data.response.error.message,
          request: response.data.request
        };
      }
      
      // If we have song data in the response, return it
      if (response.data?.response?.data?.length > 0) {
        return response.data.response;
      }
      
      // If we get a response but no data, it might still be processing
      if (response.data?.response) {
        console.log(`Task ${taskId} still processing:`, response.data.response);
      }
      
      // Wait 5 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error: any) {
      console.error(`Error polling task status (attempt ${attempt + 1} for task ${taskId}):`, error);
      console.error('Error details:', error.response?.data || error.message);
      
      // On last attempt, return null instead of throwing
      if (attempt === maxAttempts - 1) {
        console.log(`Max attempts reached for task ${taskId}`);
        return null;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.error(`Timeout waiting for task completion: ${taskId}`);
  return null;
}

function mapAceDataToAudioInfo(aceDataSong: any): AudioInfo {
  return {
    id: aceDataSong.id,
    title: aceDataSong.title || '',
    image_url: aceDataSong.image_url || '',
    lyric: aceDataSong.lyric || '',
    audio_url: aceDataSong.audio_url || '',
    video_url: aceDataSong.video_url || '',
    created_at: aceDataSong.created_at || new Date().toISOString(),
    model_name: aceDataSong.model || 'chirp-v4',
    status: aceDataSong.state || 'succeeded',
    gpt_description_prompt: aceDataSong.prompt || '',
    prompt: aceDataSong.prompt || '',
    type: 'music',
    tags: aceDataSong.style || '',
    duration: Number(aceDataSong.duration) || 0,
    error_message: aceDataSong.error_message
  };
}

export async function createSongWithAceData(payload: AceDataPayload): Promise<AudioInfo[]> {
  const headers = {
    'Content-Type': 'application/json',
    'authorization': `Bearer ${aceDataApiKey}`,
  };

  try {
    // Initial request to get task_id
    const response = await axios.post(aceDataApiUrl, payload, { headers });

    if (!response.data?.task_id) {
      throw new Error('No task_id received from AceData API');
    }

    // Instead of polling, return temporary songs with task-based IDs
    const taskId = response.data.task_id;
    const currentTime = new Date().toISOString();

    // Return two temporary songs with task-based IDs
    return [
      {
        id: `${taskId}-ace_1`,
        title: '',
        image_url: '',
        lyric: '',
        audio_url: '',
        video_url: '',
        created_at: currentTime,
        model_name: payload.model || 'chirp-v4',
        status: 'pending',
        gpt_description_prompt: payload.prompt || '',
        prompt: payload.prompt || '',
        type: 'music',
        tags: payload.style || '',
        duration: 0,
        error_message: ''
      },
      {
        id: `${taskId}-ace_2`,
        title: '',
        image_url: '',
        lyric: '',
        audio_url: '',
        video_url: '',
        created_at: currentTime,
        model_name: payload.model || 'chirp-v4',
        status: 'pending',
        gpt_description_prompt: payload.prompt || '',
        prompt: payload.prompt || '',
        type: 'music',
        tags: payload.style || '',
        duration: 0,
        error_message: ''
      }
    ];
  } catch (error: any) {
    console.error('AceData API error:', error.response ? error.response.data : error.message);
    throw new Error('Error creating song with AceData');
  }
}

// Add a helper function to check if an ID is an AceData temporary ID
export function isAceDataTemporaryId(id: string): boolean {
  return id.endsWith('-ace_1') || id.endsWith('-ace_2');
}

// Add a function to get the real task ID from a temporary ID
export function getTaskIdFromTemporaryId(temporaryId: string): string {
  return temporaryId.replace(/-ace_[12]$/, '');
}

// Modify getSongDetails to handle temporary IDs and errors
export async function getSongDetails(songIds?: string[]): Promise<AudioInfo[]> {
  if (!songIds || songIds.length === 0) {
    return [];
  }

  // Update the pending song template
  const pendingSongTemplate: AudioInfo = {
    id: '',
    title: '',
    image_url: '',
    lyric: '',
    audio_url: '',
    video_url: '',
    created_at: new Date().toISOString(),
    model_name: 'chirp-v4',
    status: 'pending',
    gpt_description_prompt: '',
    prompt: '',
    type: 'music',
    tags: '',
    duration: 0,
    error_message: ''
  };

  try {
    // Separate IDs into FoxAI and AceData groups
    const aceDataIds: string[] = [];
    const foxAiIds: string[] = [];
    
    songIds.forEach(id => {
      if (isAceDataTemporaryId(id)) {
        aceDataIds.push(id);
      } else {
        foxAiIds.push(id);
      }
    });

    // Process both types of IDs in parallel
    const [aceDataResults, foxAiResults] = await Promise.all([
      // Process AceData IDs
      (async () => {
        if (aceDataIds.length === 0) return [];

        // Group IDs by task ID
        const taskGroups = new Map<string, string[]>();
        aceDataIds.forEach(id => {
          const taskId = getTaskIdFromTemporaryId(id);
          if (!taskGroups.has(taskId)) {
            taskGroups.set(taskId, []);
          }
          taskGroups.get(taskId)!.push(id);
        });

        // Process each task group
        const results = await Promise.all(
          Array.from(taskGroups.entries()).map(async ([taskId, tempIds]) => {
            try {
              const response = await pollTaskStatus(taskId, 1);
              
              // Handle forbidden error
              if (response?.error === 'forbidden') {
                console.log(`🚫 Handling forbidden error for task ${taskId}`);
                
                // Create a user-friendly message for different forbidden cases
                let errorMessage = response.message || 'Content not allowed';
                let userMessage = response.message || 'Content not allowed';
                
                if (response.message?.toLowerCase().includes('artist name')) {
                  const artistName = response.message.split(':')[1]?.trim() || '';
                  userMessage = `The word "${artistName}" appears to be an artist name. Please remove any artist names from your input.`;
                } else if (response.message?.toLowerCase().includes('flagged for moderation')) {
                  userMessage = 'Your song description contains content that is not allowed. Please modify your description and try again.';
                }
                
                return tempIds.map(id => ({
                  id,
                  title: 'Error',
                  image_url: '',
                  lyric: userMessage,
                  audio_url: 'https://cdn1.suno.ai/1d268325-9fc6-4bc2-9641-0708219b298e.mp3',
                  video_url: '',
                  created_at: new Date().toISOString(),
                  model_name: '',
                  status: 'error',
                  gpt_description_prompt: response.request?.prompt || '',
                  prompt: response.request?.prompt || '',
                  type: 'music',
                  tags: '',
                  duration: 0,
                  error_message: errorMessage
                }));
              }

              // Handle stale task error
              if (response?.error === 'stale_task') {
                console.log(`⏰ Handling stale task error for task ${taskId}`);
                return tempIds.map(id => ({
                  id,
                  title: 'Error',
                  image_url: '',
                  lyric: response.message || 'The song generation request has timed out. Please try again.',
                  audio_url: 'https://cdn1.suno.ai/1d268325-9fc6-4bc2-9641-0708219b298e.mp3',
                  video_url: '',
                  created_at: new Date().toISOString(),
                  model_name: '',
                  status: 'error',
                  gpt_description_prompt: response.request?.prompt || '',
                  prompt: response.request?.prompt || '',
                  type: 'music',
                  tags: '',
                  duration: 0,
                  error_message: 'Song generation timed out after 3 minutes'
                }));
              }

              // Handle API timeout error
              if (response?.error === 'api_timeout') {
                console.log(`⏰ Handling API timeout error for task ${taskId}`);
                return tempIds.map(id => ({
                  id,
                  title: 'Error',
                  image_url: '',
                  lyric: response.message || 'The request timed out. Please try again.',
                  audio_url: 'https://cdn1.suno.ai/1d268325-9fc6-4bc2-9641-0708219b298e.mp3',
                  video_url: '',
                  created_at: new Date().toISOString(),
                  model_name: '',
                  status: 'error',
                  gpt_description_prompt: response.request?.prompt || '',
                  prompt: response.request?.prompt || '',
                  type: 'music',
                  tags: '',
                  duration: 0,
                  error_message: response.message || 'The request timed out. The server might be experiencing high load.'
                }));
              }

              // Handle no free worker error
              if (response?.error === 'no_worker') {
                console.log(`👷 Handling no free worker error for task ${taskId}`);
                return tempIds.map(id => ({
                  id,
                  title: 'Error',
                  image_url: '',
                  lyric: response.message || 'All workers are currently busy. Please try again in a few minutes.',
                  audio_url: 'https://cdn1.suno.ai/1d268325-9fc6-4bc2-9641-0708219b298e.mp3',
                  video_url: '',
                  created_at: new Date().toISOString(),
                  model_name: '',
                  status: 'error',
                  gpt_description_prompt: response.request?.prompt || '',
                  prompt: response.request?.prompt || '',
                  type: 'music',
                  tags: '',
                  duration: 0,
                  error_message: response.message || 'All workers are currently busy. The server is experiencing high demand.'
                }));
              }

              // Handle lyrics guidelines error
              if (response?.error === 'lyrics_guidelines') {
                console.log(`📝 Handling lyrics guidelines error for task ${taskId}`);
                return tempIds.map(id => ({
                  id,
                  title: 'Error',
                  image_url: '',
                  lyric: response.message || 'The lyrics or prompts do not meet our content guidelines',
                  audio_url: 'https://cdn1.suno.ai/1d268325-9fc6-4bc2-9641-0708219b298e.mp3',
                  video_url: '',
                  created_at: new Date().toISOString(),
                  model_name: '',
                  status: 'error',
                  gpt_description_prompt: response.request?.prompt || '',
                  prompt: response.request?.prompt || '',
                  type: 'music',
                  tags: '',
                  duration: 0,
                  error_message: response.message || 'The lyrics or prompts do not meet our content guidelines'
                }));
              }

              // Handle topic too long error
              if (response?.error === 'topic_too_long') {
                console.log(`📏 Handling topic too long error for task ${taskId}`);
                return tempIds.map(id => ({
                  id,
                  title: 'Error',
                  image_url: '',
                  lyric: response.message || 'Input text is too long',
                  audio_url: 'https://cdn1.suno.ai/1d268325-9fc6-4bc2-9641-0708219b298e.mp3',
                  video_url: '',
                  created_at: new Date().toISOString(),
                  model_name: '',
                  status: 'error',
                  gpt_description_prompt: response.request?.prompt || '',
                  prompt: response.request?.prompt || '',
                  type: 'music',
                  tags: '',
                  duration: 0,
                  error_message: response.message || 'Input text is too long'
                }));
              }

              // Handle tags too long error
              if (response?.error === 'tags_too_long') {
                console.log(`🏷️ Handling tags too long error for task ${taskId}`);
                return tempIds.map(id => ({
                  id,
                  title: 'Error',
                  image_url: '',
                  lyric: response.message || 'Style description is too long',
                  audio_url: 'https://cdn1.suno.ai/1d268325-9fc6-4bc2-9641-0708219b298e.mp3',
                  video_url: '',
                  created_at: new Date().toISOString(),
                  model_name: '',
                  status: 'error',
                  gpt_description_prompt: response.request?.prompt || '',
                  prompt: response.request?.prompt || '',
                  type: 'music',
                  tags: '',
                  duration: 0,
                  error_message: response.message || 'Style description is too long'
                }));
              }

              // Default error handler for any unhandled error
              if (response?.error === 'api_error') {
                console.log(`❌ Handling unhandled API error for task ${taskId}`);
                return tempIds.map(id => ({
                  id,
                  title: 'Error',
                  image_url: '',
                  lyric: response.message || 'An unexpected error occurred. Please try again.',
                  audio_url: 'https://cdn1.suno.ai/1d268325-9fc6-4bc2-9641-0708219b298e.mp3',
                  video_url: '',
                  created_at: new Date().toISOString(),
                  model_name: '',
                  status: 'error',
                  gpt_description_prompt: response.request?.prompt || '',
                  prompt: response.request?.prompt || '',
                  type: 'music',
                  tags: '',
                  duration: 0,
                  error_message: response.message || 'Unexpected API error'
                }));
              }
              
              if (response?.data?.length > 0) {
                return tempIds.map((tempId, index) => {
                  const realSong = response.data[index];
                  if (realSong && (realSong.state === 'succeeded' || realSong.state === 'running')) {
                    return mapAceDataToAudioInfo(realSong);
                  }
                  // If state is not 'succeeded' or audio_url is not from cdn1.suno.ai, return pending template with available data
                  return {
                    ...pendingSongTemplate,
                    id: tempId,
                    title: realSong?.title || '',
                    image_url: realSong?.image_url || '',
                    lyric: realSong?.lyric || '',
                    prompt: realSong?.prompt || '',
                    gpt_description_prompt: realSong?.gpt_description_prompt || '',
                    tags: realSong?.style || ''
                  };
                });
              }
              
              return tempIds.map(id => ({ ...pendingSongTemplate, id }));
            } catch (error) {
              console.error(`Error getting song details for task ${taskId}:`, error);
              return tempIds.map(id => ({
                ...pendingSongTemplate,
                id,
                title: 'Error',
                status: 'error',
                lyric: 'An error occurred during song creation. Please try again',
                error_message: 'Failed to get song details'
              }));
            }
          })
        );

        return results.flat();
      })(),
      // Process FoxAI IDs
      (async () => {
        if (foxAiIds.length === 0) return [];
        
        try {
          return await getFoxAISongDetails(foxAiIds);
        } catch (error) {
          console.error('Error getting FoxAI song details:', error);
          return foxAiIds.map(id => ({
            id,
            title: 'Error',
            image_url: '',
            lyric: 'An error occurred while fetching song details',
            audio_url: '',
            video_url: '',
            created_at: new Date().toISOString(),
            model_name: '',
            status: 'error',
            gpt_description_prompt: '',
            prompt: '',
            type: 'music',
            tags: '',
            duration: 0,
            error_message: 'Failed to get FoxAI song details'
          }));
        }
      })()
    ]);

    // Combine and return results
    return [...aceDataResults, ...foxAiResults];

  } catch (error: any) {
    console.error('Song details error:', error.response ? error.response.data : error.message);
    return songIds.map(id => ({
      id,
      title: 'Error',
      image_url: '',
      lyric: 'An error occurred while fetching song details',
      audio_url: '',
      video_url: '',
      created_at: new Date().toISOString(),
      model_name: '',
      status: 'error',
      gpt_description_prompt: '',
      prompt: '',
      type: 'music',
      tags: '',
      duration: 0,
      error_message: error.response?.data?.message || error.message || 'Failed to get song details'
    }));
  }
}

export async function generate(
  prompt: string,
  make_instrumental: boolean = false,
  model: string = 'chirp-v4',
  wait_audio: boolean = true
): Promise<AudioInfo[]> {
  // Check input length before making the request
  // if (prompt.length > 200) {
  //   throw new Error('Input text is too long. Please limit your input to 200 characters.');
  // }

  const payload: AceDataPayload = {
    action: 'generate',
    prompt,
    model,
    instrumental: make_instrumental,
    custom: false,
    callback_url: "https://webhook.site"
  };

  return createSongWithAceData(payload);
}

export async function customGenerate(
  title: string,
  lyrics: string,
  style: string,
  make_instrumental: boolean = false,
  model: string = 'chirp-v4'
): Promise<AudioInfo[]> {
  // // Check input length before making the request
  // if (lyrics.length > 2800) {
  //   throw new Error('Input text is too long. Please limit your input to 2800 characters.');
  // }

  // // Check style/tags length
  // if (style.length > 200) {
  //   throw new Error('Style description is too long. Please use a shorter description for the music style (maximum 200 characters).');
  // }

  const payload: AceDataPayload = {
    action: 'generate',
    prompt: '', // Empty prompt for custom generation
    model,
    lyric: lyrics,
    custom: true,
    instrumental: make_instrumental,
    title,
    style,
    callback_url: "https://webhook.site"
  };

  return createSongWithAceData(payload);
}