import React, { useState, useEffect } from 'react';
<script src="https://cdn.jsdelivr.net/npm/fhirclient/build/fhir-client.js"></script>

type Message = {
  role: 'user' | 'assistant';
  content: string;
  steps?: Array<{
    stepNumber: number;
    tool: string;
    args: any;
    status: string;
    duration?: number;
    resultSummary?: string;
  }>;
  totalSteps?: number;
};

export function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! Ask me about Patient details.' }
  ]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [backendUrl, setBackendUrl] = useState('http://localhost:8081');
  const [loading, setLoading] = useState(false);
  const [showSteps, setShowSteps] = useState(true);


  const send = async () => {
    if (!input.trim()) return;
    const newMsgs = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    try {
      // const authToken = JSON.parse(sessionStorage.getItem('tokenResponse')!);
      // let accessToken: string = "";
      // if (authToken != null && authToken['access_token']) {
      //   accessToken = authToken['access_token']
      // }
      const resp = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          conversationId: 'web:' + (sessionStorage.getItem('convId') || (() => { const id = Math.random().toString(36).slice(2); sessionStorage.setItem('convId', id); return id; })()),
          token: "abc123"
        })
      });
      const data = await resp.json();
      const content = data?.message?.content ?? (data?.error ? `Error: ${data.error}` : data.descriptions);
      const assistantMsg: Message = {
        role: 'assistant',
        content
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${e?.message || 'failed'}` }]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   FHIR.oauth2.ready((client: any) => {
  //     const token = client.state.tokenResponse.access_token;
  //     const refresh = client.state.tokenResponse.refresh_token;

  //     console.log('Access Token:', token);
  //     console.log('Refresh Token:', refresh);

  //     sessionStorage.setItem('access_token', token);
  //   });
  // }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16, fontFamily: 'system-ui' }}>
      <h2>MCP Chatbot</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <input type="checkbox" checked={showSteps} onChange={(e) => setShowSteps(e.target.checked)} />
          Show tool steps
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Backend URL" value={backendUrl} onChange={e => setBackendUrl(e.target.value)} style={{ flex: 1 }} />
        <input placeholder="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: 240 }} />
      </div>
      <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, minHeight: 240 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: '8px 0' }}>
            <strong>{m.role === 'user' ? 'You' : 'Assistant'}:</strong>
            {Array.isArray(m.content) ? (
              <ol style={{ marginTop: 6, paddingLeft: 20 }}>
                {m.content.map((item, index) => (
                  <li key={index} style={{ margin: '4px 0' }}>
                    {item}
                  </li>
                ))}
              </ol>
            ) : (
              <span> {m.content}</span>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          style={{ flex: 1 }}
        />
        <button onClick={send} disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
      </div>
    </div>
  );
}
