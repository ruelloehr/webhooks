/**
 * @param context {WebtaskContext}
 */
var qs = require('querystring');
var request = require('request');
var _ = require('underscore');

module.exports = function (context, req, res) {


    //a quick and dirty poc to get pr descriptions added as comments to the according issue in youtrack


    let youtrackUrl = 'https://myyoutrack.myjetbrains.com';
    let apiUrl = youtrackUrl + '/youtrack/rest/';
    let authHeader = 'Bearer: somevalue';

}

    let body = '';

    req.on('data', function (data) {
        body += data;
    });

    req.on('end', function () {
        var postData = JSON.parse(body);

        if (postData.action === 'closed' && postData.pull_request.merged === true) {
            console.log('Received a merged pull request: ' + postData.pull_request.title);

            var issue = postData.pull_request.title.split('#')[1];
            console.log('issue is: ', issue);

            var url = apiUrl + 'issue/execute/' + issue +
                '?comment=placeholder';


            //first create a new comment on the issue
            console.log('Url to create a new comment ' + url);

            request.post({
                    url: url,
                    headers: {
                        'Authorization': authHeader
                    },
                    body: ''
                }, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        console.log(body);

                        //now we need to get a list of all comments and select the last one

                        request.get({
                                url: apiUrl + 'issue/' + issue + '/comment',
                                headers: {
                                    'Authorization': authHeader,
                                    'Accept': 'application/json'
                                },
                                body: ''
                            }, function (error, response, body) {
                                if (!error && response.statusCode == 200) {

                                    //get the last comment
                                    var commentId = _.last(JSON.parse(body)).id;
                                    console.log('CommentId is ' + commentId);

                                    //now update the comment with the data from github
                                    request.put({
                                            url: apiUrl + 'issue/' + issue + '/comment/' +
                                            commentId,
                                            headers: {
                                                'Authorization': authHeader,
                                                'Accept': 'application/json',
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                                "text": postData.pull_request.body,
                                                "isMarkdown": true
                                            })
                                        }, function (error, response, body) {
                                            console.log('here', error, body);
                                            if (!error && response.statusCode == 200) {
                                                console.log('all done', body);
                                            } else {
                                                console.log(error, response.statusCode);
                                            }
                                        }
                                    );

                                } else {
                                    console.log(error, response.statusCode);
                                }
                            }
                        );

                    } else {
                        console.log(error, response.statusCode);
                    }
                }
            );
        }
        else {
            console.log('no');
        }

    });

    res.writeHead(200, {'Content-Type': 'text/html '});
    res.end('');
