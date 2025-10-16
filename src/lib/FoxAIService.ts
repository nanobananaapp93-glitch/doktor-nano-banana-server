import axios from 'axios';
import { AudioInfo } from './SunoApi';

const foxaiApiKey = '+aNuzEH9dJDreI/Uw914Rd0m9y83iH38';

if (!foxaiApiKey) {
  throw new Error('FOXAI_API_KEY must be set in environment variables.');
}

const foxaiApiUrl = 'https://api.foxai.me/api/v1/gateway/generate/music';
const foxaiApiUrlForPrompt = 'https://api.foxai.me/api/v1/gateway/generate/gpt_desc'
const foxaiQueryUrl = 'https://api.foxai.me/api/v1/gateway/query';
const foxaiLyricsUrl = 'https://api.foxai.me/api/v1/music/lyrics';

export interface FoxAIPayload {
  title: string;
  tags: string;
  generation_type?: string;
  prompt: string;
  negative_tags?: string;
  mv: string;
  continue_at?: number;
  continue_clip_id?: string;
  make_instrumental?: boolean;
}

export async function createSongWithFoxAI(payload: FoxAIPayload): Promise<AudioInfo[]> {
  const headers = {
    'Content-Type': 'application/json',
    'api-key': foxaiApiKey,
  };

  try {
    const response = await axios.post(foxaiApiUrl, payload, { headers });

    if (response.status !== 200 || !response.data || !response.data.data) {
      console.error('FoxAI API response:', response.data);
      throw new Error('Failed to create song with FoxAI.');
    }

    return response.data.data.map((song: any) => ({
      id: song.song_id,
      title: song.title,
      image_url: song.image_url || song.image_large_url,
      lyric: song.meta_prompt,
      audio_url: song.audio_url,
      video_url: song.video_url,
      created_at: new Date().toISOString(), // FoxAI doesn't provide creation time
      model_name: song.model_name,
      status: song.status,
      prompt: song.meta_prompt,
      tags: song.meta_tags,
      duration: song.meta_duration,
      error_message: song.meta_error_msg,
      type: 'music' // Default type since FoxAI doesn't provide this
    }));
  } catch (error: any) {
    console.error('FoxAI API error:', error.response ? error.response.data : error.message);
    throw new Error('Error creating song with FoxAI.');
  }
}

// Update this helper function before getSongDetails
function isBrokenResponse(song: any): boolean {
  // Check if audio_url is missing or doesn't start with the expected prefix
  const hasValidAudioUrl = song.audio_url && 
    song.audio_url.startsWith('https://cdn1.suno.ai/');
  
  if (!hasValidAudioUrl && song.created_at) {
    // song.created_at is in ISO 8601 format with Z suffix (UTC)
    const createdAtUtc = new Date(song.created_at).getTime();
    const currentTimeUtc = Date.now(); // UTC milliseconds since epoch
    const SIX_MINUTES_MS = 6 * 60 * 1000;
    
    return createdAtUtc < (currentTimeUtc - SIX_MINUTES_MS);
  }
  return false;
}

export async function getSongDetails(songIds?: string[]): Promise<AudioInfo[]> {
  const headers = {
    'Content-Type': 'application/json',
    'api-key': foxaiApiKey,
  };
  
  try {
    // Check if any of the error IDs are in the request
    const errorIds = [
      'a5301ca1-b12b-4f97-b9a0-bb05ac966383',
      '6a4b0e7d-0a57-4b59-96ee-c9fa2ed5127a',
      '93134b99-6af3-4f02-a9db-1fe95bdeaa21'
    ];
    
    if (songIds?.some(id => errorIds.includes(id))) {
      return songIds.map(id => ({
        id,
        title: 'Error',
        image_url: '',
        lyric: 'An error occured during song creation. Please try again',
        audio_url: `https://cdn1.suno.ai/1d268325-9fc6-4bc2-9641-0708219b298e.mp3`,
        video_url: '',
        created_at: '',
        model_name: '',
        status: 'error',
        gpt_description_prompt: '',
        prompt: '',
        type: '',
        tags: '',
        error_message: 'Song generation failed'
      }));
    }

    let url = foxaiQueryUrl;
    if (songIds && songIds.length > 0) {
      url = `${url}?ids=${songIds.join(',')}`;
    }

    const response = await axios.get(url, { headers });

    if (response.status !== 200) {
      console.error('FoxAI Query API response:', response.data);
      throw new Error('Failed to get song details from FoxAI.');
    }

    // If response data is empty array and we have songIds, return error objects
    if (Array.isArray(response.data) && response.data.length === 0 && songIds && songIds.length > 0) {
      return songIds.map(id => ({
        id,
        title: 'Error',
        image_url: '',
        lyric: 'Song not found or no longer available',
        audio_url: `https://cdn1.suno.ai/1d268325-9fc6-4bc2-9641-0708219b298e.mp3`,
        video_url: '',
        created_at: new Date().toISOString(),
        model_name: '',
        status: 'error',
        gpt_description_prompt: '',
        prompt: '',
        type: '',
        tags: '',
        error_message: 'Song not found'
      }));
    }

    // Map response and check for broken responses
    return response.data.map((song: any) => {
      if (isBrokenResponse(song)) {
        return {
          id: song.id,
          title: 'Error',
          image_url: '',
          lyric: 'An error occurred during song creation. The request timed out.',
          audio_url: `https://cdn1.suno.ai/1d268325-9fc6-4bc2-9641-0708219b298e.mp3`,
          video_url: '',
          created_at: song.created_at,
          model_name: song.model_name || '',
          status: 'error',
          gpt_description_prompt: '',
          prompt: '',
          type: '',
          tags: '',
          error_message: 'Song generation timed out'
        };
      }

      return {
        id: song.id,
        title: song.title || '',
        image_url: song.image_url || song.image_large_url || '',
        lyric: song.meta_data.prompt || song.meta_data.gpt_description_prompt || '',
        audio_url: song.audio_url || '',
        video_url: song.video_url || '',
        created_at: song.created_at || new Date().toISOString(),
        model_name: song.model_name || 'chirp-v4',
        status: song.status,
        gpt_description_prompt: song.meta_data.gpt_description_prompt || '',
        prompt: song.meta_data.prompt || song.meta_data.gpt_description_prompt || '',
        type: song.meta_data.type || 'music',
        tags: song.meta_data.tags || '',
        duration: song.meta_data.duration || null,
        error_message: song.meta_data.error_message || null
      };
    });
  } catch (error: any) {
    console.error('FoxAI Query API error:', error.response ? error.response.data : error.message);
    // Return fallback data for each requested song ID
    return (songIds || []).map(id => ({
      id,
      title: 'Error',
      image_url: '',
      lyric: 'An error occured during song creation. Please try again',
      audio_url: `https://cdn1.suno.ai/1d268325-9fc6-4bc2-9641-0708219b298e.mp3`,
      video_url: '',
      created_at: '',
      model_name: '',
      status: '',
      gpt_description_prompt: '',
      prompt: '',
      type: '',
      tags: '',
      error_message: ''
    }));
  }
}

export async function generate(
  prompt: string,
  make_instrumental: boolean = false,
  model?: string,
  wait_audio: boolean = false
): Promise<AudioInfo[]> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'api-key': foxaiApiKey,
    };

    const payload = {
      gpt_description_prompt: prompt,
      make_instrumental: make_instrumental,
      mv: 'chirp-v4'
    };

    const response = await axios.post(foxaiApiUrlForPrompt, payload, { headers });

    if (response.status !== 200 || !response.data || !response.data.data) {
      console.error('FoxAI API response:', response.data);
      throw new Error('Failed to generate with FoxAI.');
    }

    const audios = response.data.data.map((song: any) => ({
      id: song.song_id,
      title: song.title,
      image_url: song.image_url || song.image_large_url,
      lyric: song.meta_prompt,
      audio_url: song.audio_url,
      video_url: song.video_url,
      created_at: new Date().toISOString(),
      model_name: song.model_name,
      status: song.status,
      prompt: song.meta_prompt,
      tags: song.meta_tags,
      duration: song.meta_duration,
      error_message: song.meta_error_msg,
      type: 'music'
    }));

    if (wait_audio && audios.length > 0) {
      const songIds = audios.map((audio: AudioInfo) => audio.id);
      let startTime = Date.now();
      let lastResponse = audios;

      while (Date.now() - startTime < 200000) {
        const response = await getSongDetails(songIds);
        const allCompleted = response.every(
          audio => audio.status === 'streaming' || audio.status === 'complete'
        );
        const allError = response.every(audio => audio.status === 'error');

        if (allCompleted || allError) {
          return response;
        }

        lastResponse = response;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      return lastResponse;
    }

    return audios;
  } catch (error: any) {
    console.error('FoxAI generate error:', error.response ? error.response.data : error.message);
    throw new Error('Error generating with FoxAI.');
  }
}

interface LyricsResponse {
  text: string;
  title: string;
}

export async function generateLyrics(userInput: any): Promise<LyricsResponse> {
  const headers = {
    'Content-Type': 'application/json',
    'api-key': foxaiApiKey,
  };

  try {
    const response = await axios.post(
      'https://api.foxai.me/api/v1/gateway/generate/lyrics_v2',
      { prompt: userInput },
      { headers }
    );

    if (response.status !== 200 || !response.data) {
      throw new Error('Failed to generate lyrics with FoxAI.');
    }

    return {
      text: response.data.text || '',
      title: response.data.title || 'Untitled'
    };
  } catch (error: any) {
    console.error('FoxAI lyrics generation failed:', error.response?.data || error.message);
    throw new Error(`Error generating lyrics: ${error.message}`);
  }
}