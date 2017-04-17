const exec = require('child_process').exec;
var fs = require('fs');
var fid_list;
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/fanpage_research';


function python_pid_call_promise (fid, pid){
	return new Promise(function(resolve,reject){
		exec("python graph_api_db.py "+fid+" "+pid, {maxBuffer: 1024 * 500},function(err,stdout){
			if(err){
				reject(err);
			}else if(stdout){
				resolve(stdout);
			}
		});
	});
}


function python_call_promise (fid) {
	return new Promise(function (resolve, reject) {
		exec("python graph_api_db.py " + fid, {maxBuffer: 1024 * 500},function (err, stdout) {
			if (err) {
				reject(err);
			} else if (stdout) {
				resolve(stdout);
			} else{
				reject("else promise reject");
			}
		});
	});
}


read_promise = new Promise(function(resolve,reject){
				fs.readFile('fid_list_4.json','utf8',function(err,data){
				if(err) throw err;
				fid_list = JSON.parse(data);
				var promise_fanpage_array = []
				const pythonCall = (key) => {
					if (fid_list[key]) {
						//把promise 推入array
						promise_fanpage_array.push(python_call_promise(fid_list[key].fid));
						setTimeout(() => {
							pythonCall(key+1);
						}, 200);
					} else {
						Promise.all(promise_fanpage_array)
						.then((result) => {
							resolve('fanpage and post are updated')
						});

					}
				};
				pythonCall(0);
			});
});

read_promise.then(function(result){
				console.log(result);
				MongoClient.connect(url,function(err,db){
					var col_post = db.collection('post');
					col_post.find({}).toArray(function(err,docs){
						console.log(`post collection length is ${docs.length}`);
						var promise_post_detail_array = []
						const pythonCall_pid = (key) =>{
							if (docs[key]){
								promise_post_detail_array.push(python_pid_call_promise(docs[key].fid,docs[key].pid));
								setTimeout(()=>{
									pythonCall_pid(key+1);
								},1000);
							} else {
								Promise.all(promise_post_detail_array)
								.then(function(){
									console.log('post_detail is updated');
									db.close();
								});
							}
						}
						pythonCall_pid(0);
					});
				});
			})
			.catch(function(err){
				console.log(err);
			});
