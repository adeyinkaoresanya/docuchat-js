const response = await withRetry(() =>
  openaiClient.post('/embeddings', { input: text, model: 'text-embedding-3-small' })
);


const response = await openaiBreaker.fire('/embeddings', {
  input: text,
  model: 'text-embedding-3-small',
});
