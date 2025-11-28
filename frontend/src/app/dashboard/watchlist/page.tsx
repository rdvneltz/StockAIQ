'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'

interface WatchlistStock {
  symbol: string
  name?: string
  price?: number
  changePercent?: number
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([])
  const [loading, setLoading] = useState(true)
  const [newSymbol, setNewSymbol] = useState('')
  const [addingStock, setAddingStock] = useState(false)

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const fetchWatchlist = async () => {
    try {
      const response = await api.get('/api/watchlist')
      setWatchlist(response.data.data.symbols.map((symbol: string) => ({ symbol })))

      // Fetch prices for each symbol
      for (const item of response.data.data.symbols) {
        fetchStockPrice(item)
      }
    } catch (error: any) {
      console.error('Watchlist fetch error:', error)
      if (error.response?.status !== 404) {
        toast.error('Watchlist yüklenemedi')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchStockPrice = async (symbol: string) => {
    try {
      const response = await api.get(`/api/stocks/${symbol}`)
      const stock = response.data.data

      setWatchlist(prev => prev.map(item =>
        item.symbol === symbol
          ? { ...item, name: stock.name, price: stock.price, changePercent: stock.changePercent }
          : item
      ))
    } catch (error) {
      console.error(`Price fetch error for ${symbol}:`, error)
    }
  }

  const addToWatchlist = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newSymbol.trim()) {
      toast.error('Hisse sembolü giriniz')
      return
    }

    const symbol = newSymbol.toUpperCase().trim()

    if (watchlist.some(item => item.symbol === symbol)) {
      toast.error('Bu hisse zaten watchlist\'te')
      return
    }

    setAddingStock(true)
    try {
      await api.post('/api/watchlist', { symbols: [symbol] })

      setWatchlist(prev => [...prev, { symbol }])
      fetchStockPrice(symbol)

      setNewSymbol('')
      toast.success(`${symbol} watchlist'e eklendi`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Hisse eklenemedi')
    } finally {
      setAddingStock(false)
    }
  }

  const removeFromWatchlist = async (symbol: string) => {
    try {
      await api.delete(`/api/watchlist/${symbol}`)
      setWatchlist(prev => prev.filter(item => item.symbol !== symbol))
      toast.success(`${symbol} watchlist'ten kaldırıldı`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Hisse kaldırılamadı')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Watchlist</h1>
          <p className="text-gray-400 mt-1">Takip ettiğiniz hisseler</p>
        </div>
      </div>

      {/* Add Stock Form */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Hisse Ekle</h2>
        <form onSubmit={addToWatchlist} className="flex gap-3">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            placeholder="Hisse sembolü (örn: THYAO)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={10}
          />
          <button
            type="submit"
            disabled={addingStock}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
          >
            <Plus size={20} />
            {addingStock ? 'Ekleniyor...' : 'Ekle'}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-3">
          Popüler hisseler: THYAO, GARAN, AKBNK, EREGL, SAHOL, KCHOL, PETKM, SISE, VAKBN, ISCTR
        </p>
      </div>

      {/* Watchlist */}
      {watchlist.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-12 border border-gray-800 text-center">
          <div className="text-gray-400 mb-4">
            Watchlist'iniz boş
          </div>
          <p className="text-gray-500 text-sm">
            Yukarıdaki formdan hisse ekleyerek başlayın
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {watchlist.map((stock) => (
            <div
              key={stock.symbol}
              className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/dashboard/stock/${stock.symbol}`}
                  className="flex-1 hover:text-blue-400 transition"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold">{stock.symbol}</h3>
                      {stock.name && (
                        <p className="text-sm text-gray-400">{stock.name}</p>
                      )}
                    </div>

                    {stock.price !== undefined && (
                      <div className="flex items-center gap-4 ml-auto">
                        <div className="text-right">
                          <div className="text-2xl font-bold">₺{stock.price.toFixed(2)}</div>
                          {stock.changePercent !== undefined && (
                            <div className={`flex items-center gap-1 text-sm ${
                              stock.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {stock.changePercent >= 0 ? (
                                <TrendingUp size={16} />
                              ) : (
                                <TrendingDown size={16} />
                              )}
                              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>

                <button
                  onClick={() => removeFromWatchlist(stock.symbol)}
                  className="ml-4 p-2 text-red-500 hover:bg-red-900/20 rounded-lg transition"
                  title="Watchlist'ten kaldır"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
