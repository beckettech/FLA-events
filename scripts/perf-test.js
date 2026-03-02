#!/usr/bin/env node

/**
 * Performance testing script for FLA Events API
 * Tests response times for various endpoints
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'

const endpoints = [
  { name: 'Home API', path: '/api/route' },
  { name: 'All Events', path: '/api/events' },
  { name: 'Events by Category', path: '/api/events?category=music' },
  { name: 'Events by Region', path: '/api/events?region=soflo' },
  { name: 'Featured Events', path: '/api/events?featured=true' },
  { name: 'Categories', path: '/api/categories' },
  { name: 'Regions', path: '/api/regions' },
  { name: 'Tags', path: '/api/tags' },
]

async function measureEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`
  const results = []
  
  // Run 3 times to test cache performance
  for (let i = 0; i < 3; i++) {
    const start = Date.now()
    try {
      const response = await fetch(url)
      const elapsed = Date.now() - start
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const cacheStatus = response.headers.get('X-Cache') || 'N/A'
      
      results.push({
        success: true,
        time: elapsed,
        cache: cacheStatus,
        dataSize: Array.isArray(data) ? data.length : 1,
      })
    } catch (error) {
      results.push({
        success: false,
        time: Date.now() - start,
        error: error.message,
      })
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

async function runTests() {
  console.log('🚀 FLA Events Performance Test\n')
  console.log(`Testing: ${BASE_URL}`)
  console.log('=' .repeat(80))
  
  const allResults = {}
  
  for (const endpoint of endpoints) {
    console.log(`\n📊 Testing: ${endpoint.name}`)
    console.log('-'.repeat(80))
    
    const results = await measureEndpoint(endpoint)
    allResults[endpoint.name] = results
    
    results.forEach((result, i) => {
      if (result.success) {
        const cacheIcon = result.cache === 'HIT' ? '✅' : '❌'
        console.log(
          `  Run ${i + 1}: ${result.time}ms ${cacheIcon} Cache: ${result.cache} | Data: ${result.dataSize} items`
        )
      } else {
        console.log(`  Run ${i + 1}: ❌ FAILED - ${result.error}`)
      }
    })
    
    const successfulRuns = results.filter(r => r.success)
    if (successfulRuns.length > 0) {
      const times = successfulRuns.map(r => r.time)
      const avg = times.reduce((a, b) => a + b, 0) / times.length
      const min = Math.min(...times)
      const max = Math.max(...times)
      
      console.log(`  📈 Avg: ${avg.toFixed(0)}ms | Min: ${min}ms | Max: ${max}ms`)
    }
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('✅ Performance Test Complete!\n')
  
  // Summary
  const allTimes = Object.values(allResults)
    .flat()
    .filter(r => r.success)
    .map(r => r.time)
  
  if (allTimes.length > 0) {
    const overallAvg = allTimes.reduce((a, b) => a + b, 0) / allTimes.length
    const under500 = allTimes.filter(t => t < 500).length
    const under1000 = allTimes.filter(t => t < 1000).length
    
    console.log('📊 Overall Statistics:')
    console.log(`  • Total Requests: ${allTimes.length}`)
    console.log(`  • Average Response Time: ${overallAvg.toFixed(0)}ms`)
    console.log(`  • Under 500ms: ${under500} (${((under500 / allTimes.length) * 100).toFixed(1)}%)`)
    console.log(`  • Under 1000ms: ${under1000} (${((under1000 / allTimes.length) * 100).toFixed(1)}%)`)
    console.log(`  • Slowest: ${Math.max(...allTimes)}ms`)
    console.log(`  • Fastest: ${Math.min(...allTimes)}ms`)
    
    if (overallAvg < 500) {
      console.log('\n🎉 SUCCESS: All endpoints respond under 500ms average!')
    } else if (overallAvg < 1000) {
      console.log('\n⚠️  WARNING: Some endpoints are slower than 500ms')
    } else {
      console.log('\n❌ NEEDS WORK: Average response time exceeds 1000ms')
    }
  }
}

runTests().catch(console.error)
