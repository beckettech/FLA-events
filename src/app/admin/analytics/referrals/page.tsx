'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  TrendingUp,
  Share2,
  Target,
  Award,
  RefreshCw,
} from 'lucide-react'

interface ReferralStats {
  referrals: {
    total: number
    converted: number
    pending: number
    conversionRate: string
  }
  shares: {
    total: number
    byPlatform: Array<{ platform: string; count: number }>
  }
  recent: Array<any>
}

interface LeaderboardEntry {
  userId: string
  name: string
  image: string | null
  referralCount: number
}

export default function ReferralsAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [timeframe, setTimeframe] = useState<'all' | 'week' | 'month'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      loadData()
    }
  }, [status, timeframe])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, leaderboardRes] = await Promise.all([
        fetch('/api/referrals/stats'),
        fetch('/api/referrals/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeframe, limit: 10 }),
        }),
      ])

      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json()
        setLeaderboard(data.leaderboard)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateViralCoefficient = () => {
    if (!stats) return '0.0'
    const { total, converted } = stats.referrals
    if (total === 0) return '0.0'
    // Viral coefficient = (converted referrals) / (total unique referrers)
    // Simplified: converted / total as proxy
    return (converted / total).toFixed(2)
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Referral Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your referrals and viral growth
            </p>
          </div>
          <Button onClick={loadData} variant="outline">
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Referrals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.referrals.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.referrals.pending} pending
              </p>
            </CardContent>
          </Card>

          {/* Converted */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.referrals.converted}</div>
              <p className="text-xs text-muted-foreground">
                {stats.referrals.conversionRate}% conversion rate
              </p>
            </CardContent>
          </Card>

          {/* Total Shares */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.shares.total}</div>
              <p className="text-xs text-muted-foreground">
                Across all platforms
              </p>
            </CardContent>
          </Card>

          {/* Viral Coefficient */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Viral Coefficient</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateViralCoefficient()}</div>
              <p className="text-xs text-muted-foreground">
                Growth multiplier
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Shares by Platform */}
        <Card>
          <CardHeader>
            <CardTitle>Shares by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.shares.byPlatform.map((platform) => (
                <div key={platform.platform} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {platform.platform}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">{platform.count} shares</div>
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(platform.count / stats.shares.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Referrers</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={timeframe === 'all' ? 'default' : 'outline'}
                onClick={() => setTimeframe('all')}
              >
                All Time
              </Button>
              <Button
                size="sm"
                variant={timeframe === 'month' ? 'default' : 'outline'}
                onClick={() => setTimeframe('month')}
              >
                Month
              </Button>
              <Button
                size="sm"
                variant={timeframe === 'week' ? 'default' : 'outline'}
                onClick={() => setTimeframe('week')}
              >
                Week
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">
                      {index + 1}
                    </div>
                    {entry.image ? (
                      <img
                        src={entry.image}
                        alt={entry.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                    <div>
                      <div className="font-semibold">{entry.name}</div>
                      {index === 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Award size={12} className="mr-1" />
                          Top Referrer
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{entry.referralCount}</div>
                    <div className="text-xs text-gray-500">referrals</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent.slice(0, 10).map((referral: any) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      {referral.event ? (
                        <div className="font-medium">{referral.event.title}</div>
                      ) : (
                        <div className="text-gray-500">Direct referral</div>
                      )}
                      {referral.referee && (
                        <div className="text-xs text-gray-500">
                          Referred: {referral.referee.name || referral.referee.email}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={referral.status === 'converted' ? 'default' : 'outline'}
                  >
                    {referral.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
