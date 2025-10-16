import { Configuration, OpenAIApi } from 'openai';

export const maxDuration = 60; // allow longer timeout for wait_audio == true
export const dynamic = "force-dynamic";


const TIMEOUT_DURATION = 30000; // 30 seconds timeout


const configuration = new Configuration({});

const openai = new OpenAIApi(configuration);

// Define a generic timeout wrapper function
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

// Create the OpenAI request function
async function createOpenAIRequest(prompt: string, temperature: number) {
  console.log("inside create function ");
  return openai.createChatCompletion({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant that writes song lyrics.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 500,
    temperature: temperature,
  });
}


export async function generateLyrics(userInput: any): Promise<string> {
  console.log("inside the generateLyrics function");
  const prompt = `Write song lyrics based on the following input, in the language of the input:\n${JSON.stringify(userInput)}\nLyrics`;
  console.log(`the prompt is ${prompt}`);


  try {
    console.log("sending OPENAI request ... ");
    
    // Wrap the OpenAI request with timeout handling
    const response = await withTimeout(
      createOpenAIRequest(prompt, 0.7),
      TIMEOUT_DURATION,
      'OpenAI request timed out after 30 seconds'
    );

    console.log(`response is returned`);

    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
      console.error("Invalid response structure:", response);
      throw new Error('Invalid response structure from OpenAI');
    }

    const lyrics = response.data.choices[0].message?.content?.trim();

    console.log(`lyric is: ${lyrics}`);
    
    if (!lyrics) {
      console.error("No lyrics generated in response:", response.data);
      throw new Error('Failed to generate lyrics.');
    }

    return lyrics;

  } catch (error: any) {
    // Enhanced error handling with timeout-specific messaging
    if (error.message.includes('timed out')) {
      console.error('Request timeout:', error.message);
      throw new Error('Request timed out. Please try again.');
    }
    
    if (error.response) {
      console.error('OpenAI API error response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    throw new Error(`Error generating lyrics: ${error.message}`);
  }
}