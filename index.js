const rp = require('request-promise')

const env = process.env

// add your username/password, or set with ENV variables
const username = '' || env.COX_USERNAME
const password = '' || env.COX_PASSWORD

// may need a different loginUrl depending on location?
const loginUrl = 'https://idm.east.cox.net/idm/coxnetlogin'
const dataUrl = 'https://www.cox.com/internet/mydatausage.cox'

async function getDataUsage() {
  if (!username || !password) {
    throw new Error('Username and Password are required')
  }

  const cookieJar = rp.jar()
  await login(cookieJar)
    .catch(err => {
      throw new Error(`Login failed: ${err}`)
    })

  const results = await scrape(cookieJar)
    .catch(err => {
      throw new Error(`Scrape failed: ${err}`)
    })

  return results
}

// headers and form fields determined with Postman Interceptor
function login(cookieJar) {
  const options = {
    method: 'POST',
    uri: loginUrl,
    form: {
      emaildomain: '@cox.net',
      onfailure: 'https://webcdn.cox.com/content/dam/cox/residential/login.html?onsuccess=https%3A%2F%2Fwww.cox.com%2Fresaccount%2Fhome.cox&',
      onsuccess: 'https%3A%2F%2Fwww.cox.com%2Fresaccount%2Fhome.cox',
      targetFN: 'COX.net',
      username,
      password
    },
    headers: {
      Origin: 'https://webcdn.cox.com',
      'Upgrade-Insecure-Requests': 1,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      Referer: 'https://webcdn.cox.com/content/dam/cox/residential/login.html?onsuccess=https%3A%2F%2Fwww.cox.com%2Fresaccount%2Fhome.cox&onfailure=http%3A%2F%2Fwww.cox.comhttps%3A%2F%2Fwebcdn.cox.com%2Fcontent%2Fdam%2Fcox%2Fresidential%2Flogin.html',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9,mt;q=0.8'
    },
    followAllRedirects: true,
    jar: cookieJar
  }

  return rp(options)
}

async function scrape(cookieJar) {
  const options = {
    method: 'GET',
    uri: dataUrl,
    jar: cookieJar
  }
  const body = await rp(options)

  try {
    const daysLeft = /"dumDaysLeft": "(\d*)"/.exec(body)[1]
    const limit = /"dumLimit": "(\d*)"/.exec(body)[1]
    const usage = /"dumUsage": "(\d*)"/.exec(body)[1]
    const utilization = /"dumUtilization": "(<?\d*)"/.exec(body)[1]

    return {
      daysLeft,
      limit,
      usage,
      utilization
    }
  } catch (error) {
    throw new Error(`Scrape failed, Err: ${error}`)
  }
}

function printUsage(d) {
  console.log(`Used: ${d.usage} / ${d.limit}GB (${d.utilization}%), Days left: ${d.daysLeft}`)
}

async function getUsageAndPrint() {
  const d = await getDataUsage()
  printUsage(d)
}

/* use standalone */
getUsageAndPrint()
  .catch(err => console.error(err))

/* use as a module */
// module.exports = {
//   getDataUsage,
//   getUsageAndPrint
// }
