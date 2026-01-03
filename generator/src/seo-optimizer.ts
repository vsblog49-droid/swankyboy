import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function optimizeSEO(
  articleContent: any,
  topic: string
): Promise<{ metaTitle: string; metaDescription: string; keywords: string[] }> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'Generate SEO-optimized metadata. Be concise and compelling.'
      },
      {
        role: 'user',
        content: `Article title: ${articleContent.title}\nTopic: ${topic}\n\nGenerate:\n1. Meta title (50-60 chars, include target keyword)\n2. Meta description (150-160 chars, compelling CTA)\n3. 5-7 relevant keywords\n\nFormat as JSON: {metaTitle, metaDescription, keywords: []}`
      }
    ],
    temperature: 0.3,
    max_tokens: 300
  });
  
  const text = completion.choices[0].message.content || '{}';
  const cleaned = text.replace(/```json|```/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      metaTitle: articleContent.title.substring(0, 60),
      metaDescription: articleContent.excerpt.substring(0, 160),
      keywords: [topic]
    };
  }
}
