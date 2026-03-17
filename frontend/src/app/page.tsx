export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-semibold text-gray-800">Fiscal-Saathi</h1>
      <p className="text-gray-500 mt-2">Your AI Money Mentor — setting up...</p>
      <div className="mt-6 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
        ✓ Frontend running
      </div>
    </main>
  )
}
```

If you see "Fiscal-Saathi" in the browser, your full stack is working.

---

## Step 5 — API Key Setup

Go to **console.anthropic.com** → API Keys → Create Key. Copy it.

Open `backend/.env` and add:
```
ANTHROPIC_API_KEY=sk-ant-XXXXXXXXXXXXXXXX