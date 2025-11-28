'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Edit } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface PortfolioPosition {
  _id: string
  symbol: string
  quantity: number
  averagePrice: number
  currentPrice?: number
  totalValue?: number
  profitLoss?: number
  profitLossPercent?: number
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPosition, setNewPosition] = useState({
    symbol: '',
    quantity: '',
    averagePrice: ''
  })

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    try {
      const response = await api.get('/api/portfolio')
      const positions = response.data.data.positions || []
      setPortfolio(positions)

      // Fetch current prices
      for (const position of positions) {
        fetchCurrentPrice(position.symbol)
      }
    } catch (error: any) {
      console.error('Portfolio fetch error:', error)
      if (error.response?.status !== 404) {
        toast.error('Portfolio yüklenemedi')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentPrice = async (symbol: string) => {
    try {
      const response = await api.get(`/api/stocks/${symbol}`)
      const currentPrice = response.data.data.price

      setPortfolio(prev => prev.map(pos => {
        if (pos.symbol === symbol) {
          const totalValue = currentPrice * pos.quantity
          const costBasis = pos.averagePrice * pos.quantity
          const profitLoss = totalValue - costBasis
          const profitLossPercent = ((currentPrice - pos.averagePrice) / pos.averagePrice) * 100

          return {
            ...pos,
            currentPrice,
            totalValue,
            profitLoss,
            profitLossPercent
          }
        }
        return pos
      }))
    } catch (error) {
      console.error(`Price fetch error for ${symbol}:`, error)
    }
  }

  const addPosition = async (e: React.FormEvent) => {
    e.preventDefault()

    const quantity = parseFloat(newPosition.quantity)
    const averagePrice = parseFloat(newPosition.averagePrice)

    if (!newPosition.symbol || isNaN(quantity) || isNaN(averagePrice)) {
      toast.error('Tüm alanları doldurun')
      return
    }

    try {
      const response = await api.post('/api/portfolio', {
        symbol: newPosition.symbol.toUpperCase(),
        quantity,
        averagePrice
      })

      setPortfolio(prev => [...prev, response.data.data])
      fetchCurrentPrice(newPosition.symbol.toUpperCase())

      setNewPosition({ symbol: '', quantity: '', averagePrice: '' })
      setShowAddModal(false)
      toast.success('Pozisyon eklendi')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Pozisyon eklenemedi')
    }
  }

  const removePosition = async (id: string, symbol: string) => {
    try {
      await api.delete(`/api/portfolio/${id}`)
      setPortfolio(prev => prev.filter(pos => pos._id !== id))
      toast.success(`${symbol} portfolio'dan kaldırıldı`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Pozisyon kaldırılamadı')
    }
  }

  const totalValue = portfolio.reduce((sum, pos) => sum + (pos.totalValue || 0), 0)
  const totalCost = portfolio.reduce((sum, pos) => sum + (pos.averagePrice * pos.quantity), 0)
  const totalProfitLoss = totalValue - totalCost
  const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0

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
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-gray-400 mt-1">Hisse portföyünüz</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <Plus size={20} />
          Pozisyon Ekle
        </button>
      </div>

      {/* Summary */}
      {portfolio.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Toplam Değer</div>
            <div className="text-2xl font-bold">₺{totalValue.toFixed(2)}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Maliyet</div>
            <div className="text-2xl font-bold">₺{totalCost.toFixed(2)}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Kar/Zarar</div>
            <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ₺{totalProfitLoss.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Getiri</div>
            <div className={`text-2xl font-bold flex items-center gap-2 ${totalProfitLossPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalProfitLossPercent >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              {totalProfitLossPercent >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* Positions */}
      {portfolio.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-12 border border-gray-800 text-center">
          <div className="text-gray-400 mb-4">Portfolio'nuz boş</div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition inline-flex items-center gap-2"
          >
            <Plus size={20} />
            İlk Pozisyonunuzu Ekleyin
          </button>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left p-4">Hisse</th>
                <th className="text-right p-4">Miktar</th>
                <th className="text-right p-4">Ort. Fiyat</th>
                <th className="text-right p-4">Güncel Fiyat</th>
                <th className="text-right p-4">Toplam Değer</th>
                <th className="text-right p-4">Kar/Zarar</th>
                <th className="text-right p-4">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {portfolio.map((position) => (
                <tr key={position._id} className="hover:bg-gray-800/50">
                  <td className="p-4">
                    <div className="font-bold">{position.symbol}</div>
                  </td>
                  <td className="p-4 text-right">{position.quantity}</td>
                  <td className="p-4 text-right">₺{position.averagePrice.toFixed(2)}</td>
                  <td className="p-4 text-right">
                    {position.currentPrice !== undefined ? (
                      `₺${position.currentPrice.toFixed(2)}`
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right font-bold">
                    {position.totalValue !== undefined ? (
                      `₺${position.totalValue.toFixed(2)}`
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {position.profitLoss !== undefined && position.profitLossPercent !== undefined ? (
                      <div className={position.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}>
                        <div className="font-bold">₺{position.profitLoss.toFixed(2)}</div>
                        <div className="text-sm">
                          {position.profitLossPercent >= 0 ? '+' : ''}{position.profitLossPercent.toFixed(2)}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => removePosition(position._id, position.symbol)}
                      className="p-2 text-red-500 hover:bg-red-900/20 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Position Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-800">
            <h2 className="text-xl font-bold mb-4">Pozisyon Ekle</h2>
            <form onSubmit={addPosition} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Hisse Sembolü</label>
                <input
                  type="text"
                  value={newPosition.symbol}
                  onChange={(e) => setNewPosition({ ...newPosition, symbol: e.target.value.toUpperCase() })}
                  placeholder="THYAO"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Miktar</label>
                <input
                  type="number"
                  value={newPosition.quantity}
                  onChange={(e) => setNewPosition({ ...newPosition, quantity: e.target.value })}
                  placeholder="100"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Ortalama Fiyat (₺)</label>
                <input
                  type="number"
                  value={newPosition.averagePrice}
                  onChange={(e) => setNewPosition({ ...newPosition, averagePrice: e.target.value })}
                  placeholder="25.50"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
