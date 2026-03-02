'use client'

import { useState, useEffect } from 'react'

interface Sponsor {
  id: string
  name: string
  email: string
  logoUrl?: string
  website?: string
  description?: string
  tier: 'BRONZE' | 'SILVER' | 'GOLD'
  isActive: boolean
  billingEmail?: string
  phone?: string
  contactName?: string
  monthlyBudget: number
  createdAt: string
  _count: {
    sponsoredEvents: number
    analytics: number
  }
}

interface Event {
  id: string
  title: string
  slug: string
  startDate: string
  imageUrl?: string
}

interface Analytics {
  summary: {
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    ctr: number
    conversionRate: number
    period: string
  }
  eventStats: Array<{
    eventId: string
    eventTitle: string
    impressions: number
    clicks: number
    conversions: number
    ctr: string
  }>
  dailyStats: Array<{
    date: string
    impressions: number
    clicks: number
    conversions: number
  }>
}

export default function SponsorsAdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    logoUrl: '',
    website: '',
    description: '',
    tier: 'BRONZE',
    contactName: '',
    phone: '',
    billingEmail: '',
  })

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pw')
    if (saved) {
      setPassword(saved)
      setAuthed(true)
    }
  }, [])

  useEffect(() => {
    if (authed) {
      loadSponsors()
      loadEvents()
    }
  }, [authed])

  const handleLogin = () => {
    sessionStorage.setItem('admin_pw', password)
    setAuthed(true)
  }

  const loadSponsors = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sponsors', {
        headers: { Authorization: `Bearer ${password}` },
      })
      if (!res.ok) throw new Error('Failed to load sponsors')
      const data = await res.json()
      setSponsors(data.sponsors)
    } catch (err) {
      setError('Failed to load sponsors')
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/dev/events?all=true&take=100', {
        headers: { Authorization: `Bearer ${password}` },
      })
      if (!res.ok) throw new Error('Failed to load events')
      const data = await res.json()
      setEvents(data.events)
    } catch (err) {
      console.error('Failed to load events:', err)
    }
  }

  const loadAnalytics = async (sponsorId: string) => {
    try {
      const res = await fetch(`/api/analytics/sponsors/${sponsorId}?days=30`, {
        headers: { Authorization: `Bearer ${password}` },
      })
      if (!res.ok) throw new Error('Failed to load analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch (err) {
      setError('Failed to load analytics')
    }
  }

  const createSponsor = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sponsors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to create sponsor')
      await loadSponsors()
      setShowCreateModal(false)
      resetForm()
    } catch (err) {
      setError('Failed to create sponsor')
    } finally {
      setLoading(false)
    }
  }

  const updateSponsor = async (id: string, updates: Partial<Sponsor>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update sponsor')
      await loadSponsors()
    } catch (err) {
      setError('Failed to update sponsor')
    } finally {
      setLoading(false)
    }
  }

  const deleteSponsor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsor?')) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${password}` },
      })
      if (!res.ok) throw new Error('Failed to delete sponsor')
      await loadSponsors()
      setSelectedSponsor(null)
    } catch (err) {
      setError('Failed to delete sponsor')
    } finally {
      setLoading(false)
    }
  }

  const assignToEvent = async (sponsorId: string, eventId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/sponsors/${sponsorId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ eventId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to assign event')
      }
      await loadSponsors()
      setShowAssignModal(false)
    } catch (err: any) {
      setError(err.message || 'Failed to assign event')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      logoUrl: '',
      website: '',
      description: '',
      tier: 'BRONZE',
      contactName: '',
      phone: '',
      billingEmail: '',
    })
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Sponsor Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>
          {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
        </div>
      </div>
    )
  }

  const tierColors = {
    BRONZE: 'bg-orange-100 text-orange-800',
    SILVER: 'bg-gray-100 text-gray-800',
    GOLD: 'bg-yellow-100 text-yellow-800',
  }

  const tierLimits = {
    BRONZE: 5,
    SILVER: 15,
    GOLD: '∞',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sponsor Management</h1>
            <p className="text-gray-600 mt-1">Manage sponsorships and track performance</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            + New Sponsor
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sponsors List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">All Sponsors ({sponsors.length})</h2>
            {loading && <p className="text-gray-500">Loading...</p>}
            <div className="space-y-3">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  onClick={() => {
                    setSelectedSponsor(sponsor)
                    loadAnalytics(sponsor.id)
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedSponsor?.id === sponsor.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{sponsor.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${tierColors[sponsor.tier]}`}>
                          {sponsor.tier}
                        </span>
                        {!sponsor.isActive && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{sponsor.email}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>{sponsor._count.sponsoredEvents} events</span>
                        <span>${sponsor.monthlyBudget}/mo</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sponsor Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedSponsor ? (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedSponsor.name}</h2>
                    <p className="text-gray-600">{selectedSponsor.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      Assign Event
                    </button>
                    <button
                      onClick={() => deleteSponsor(selectedSponsor.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Tier Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Tier</p>
                      <p className="font-semibold">{selectedSponsor.tier}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Event Limit</p>
                      <p className="font-semibold">
                        {selectedSponsor._count.sponsoredEvents} / {tierLimits[selectedSponsor.tier]}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Budget</p>
                      <p className="font-semibold">${selectedSponsor.monthlyBudget}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold">{selectedSponsor.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                </div>

                {/* Analytics */}
                {analytics && (
                  <div>
                    <h3 className="font-semibold mb-3">Analytics (Last 30 Days)</h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600">Impressions</p>
                        <p className="text-xl font-bold text-blue-600">{analytics.summary.totalImpressions}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600">Clicks</p>
                        <p className="text-xl font-bold text-green-600">{analytics.summary.totalClicks}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-gray-600">CTR</p>
                        <p className="text-xl font-bold text-purple-600">{analytics.summary.ctr}%</p>
                      </div>
                    </div>

                    {/* Event Performance */}
                    {analytics.eventStats.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">Event Performance</h4>
                        <div className="space-y-2">
                          {analytics.eventStats.map((stat) => (
                            <div key={stat.eventId} className="p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium">{stat.eventTitle}</p>
                              <div className="flex gap-4 text-xs text-gray-600 mt-1">
                                <span>{stat.impressions} views</span>
                                <span>{stat.clicks} clicks</span>
                                <span>{stat.ctr}% CTR</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                Select a sponsor to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Sponsor Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create New Sponsor</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Contact Name"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Logo URL"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BRONZE">Bronze ($50/mo - 5 events)</option>
                <option value="SILVER">Silver ($150/mo - 15 events)</option>
                <option value="GOLD">Gold ($500/mo - Unlimited)</option>
              </select>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createSponsor}
                disabled={!formData.name || !formData.email || loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Event Modal */}
      {showAssignModal && selectedSponsor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Assign Event to {selectedSponsor.name}</h2>
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => assignToEvent(selectedSponsor.id, event.id)}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-gray-600">{new Date(event.startDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAssignModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
