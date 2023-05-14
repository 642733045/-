const axios = require('axios')
const cheerio = require('cheerio')
const iconv = require('iconv-lite') /** used to decode character */
const fs = require('fs')
const { query } = require('../mysql')
const DECODE_FORMAT = 'utf-8'
const FETCH_URL_SQL = "SELECT url from fetches where url = ?"
const FETCH_ADD_SQL = "INSERT INTO fetches (url, source_name, source_encoding, title, keywords, author, publish_date, crawltime, content) VALUES(?,?,?,?,?,?,?,?,?);";
const timeReg = /\d{4}年\d{2}月\d{2}/

let source_name = ""

/**
 * 
 * @param {string} data 
 * @param {string} url_reg 
 */
const fetchURL = (data, url_reg) => {
    // decode data
    const html = iconv.decode(Buffer.from(data), DECODE_FORMAT)

    /** this will load the html into cheerio and return a cheerio object. 
     *  Then we can use this object to traverse the DOM and manipulate the data.
    */
    const $ = cheerio.load(html, { decodeEntitiesL: true })

    // get all the links of the 
    const links = $(`a`)
    source_name = $('title').text()

    // traverse the links to find the links we want
    links.each((index, element) => {
        let url = ""
        let href = $(element).attr("href")

        if (url_reg.test(href)) {
            url = "http:" + href;
            // query database
            query(FETCH_URL_SQL, [url], (err, result, fields) => {
                if (err) throw Error('query database failed in querying whether a url has been inserted into database!')
                if (result.length > 0) {
                    console.log('URL duplicate!')
                } else {
                    fetchContentOfURL(url)
                }
            })

        }
    })
    fs.writeFile("./chinanews_title.txt", titles.join("\n"), err => {
        if (err) return err
        console.log("fetch the titles of chinanews succeed!")
    })
}

/**
 * 
 * @param {string} url 
 * @returns {string} : the ci
 */
const fetchContentOfURL = async (url) => {
    axios.get(url, { timeout: 1000 * 5 }).then(res => {
        const html = iconv.decode(Buffer.from(res.data), DECODE_FORMAT)
        const $ = cheerio.load(html, { decodeEntities: true })
        console.log("manage to get news: ", url)

        console.log("======================")
        const news = {}
        news.title = $('title').text()
        console.log(`-----${news.title}`)
        news.url = url
        news.source_name = source_name
        news.source_encoding = DECODE_FORMAT
        news.keywords = $(`meta[name="keywords"]`).eq(0).attr('content')
        console.log(`-----${news.keywords}`)
        news.author = $('.adEditor').find('span').text()
        console.log(`-----${news.author}`)

        const date = new Date()
        news.crawltime = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDay()
        console.log(`-----${news.crawltime}`)
        let time;

        console.log(timeReg.exec($('div.content_left_time').text()))

        if ((time = timeReg.exec($('div.content_left_time').text())[0])) {
            consolel.log(1,time)
            news.publish_date = time.replaceAll(/[年|月]/g, '-')
        }else {
            news.publish_date = news.crawltime
        }        
        console.log(`---------${news.publish_date}`)


        news.content = $('div.left_zw').text().replace("\r\n", "")
        console.log(news)
        query(FETCH_ADD_SQL, [news.url, news.source_name, news.source_encoding, news.title, news.keywords, news.author, news.publish_date, news.crawltime, news.content], (err, result, fields) => {
            if (err) throw new Error("failed to insert news into database!")
            console.log(`${url} has been inserted successfully!`)
        })
        const filename = source_name + "_" + news.crawltime + "_" + url.substring(url.lastIndexOf('/') + 1) + ".json";
        fs.writeFile(`../crawler_data/` + filename, JSON.stringify(news), (err) => {
            if (err) console.log("failed to write")
        })
        // const data = {}
    }).catch(err => {
        console.log("failed to fetch the content of url: ", url)
    })
}

module.exports = { fetchURL, fetchContentOfURL }