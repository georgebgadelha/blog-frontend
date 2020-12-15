
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const axios = require('axios');


const homeDescription = 'Confira abaixo os posts mais recentes.';
const contactContent = 'Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.';

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

async function getBase64(url) {
  return axios.get(url, { responseType: 'arraybuffer' }).then(response => Buffer.from(response.data, 'binary').toString('base64'))
}

function checkMaxPages(postsNum, page) {
  let maxPages = Math.ceil(postsNum / 10)
  if(page > maxPages)
  page = maxPages
  return page
}

app.get('/', async (req, res) => {
  let page = 1
  let posts = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/posts?page=${page}`)).data
  let postsDate = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/posts/allpostsdate`)).data
  let blogMainPost = posts.data[0]
  let otherPosts = posts.data.slice(1,10)
  let imageData = await getBase64(blogMainPost.imageURL)
  
  res.render('home', { description: homeDescription, blogMainPost, blogPosts: otherPosts, postsLen: posts.quantity, page, imageData, isHome: true, postsDate});
});

app.get('/posts', async (req, res) => {
  let { page } = req.query || { page: 1 }

  if(page < 2) page = 1
  let postsSize = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/posts/size`)).data.length
  page = checkMaxPages(postsSize, page)

  let posts = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/posts?page=${page}`)).data
  let postsDate = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/posts/allpostsdate`)).data
  let blogMainPost = posts.data[0]
  let otherPosts = posts.data.slice(1,10)
  let imageData = await getBase64(blogMainPost.imageURL)

  res.render('home', { description: homeDescription, blogMainPost, blogPosts: otherPosts, postsLen: posts.quantity, page, imageData, isHome: false, postsDate});
})

app.get('/signup', async (req, res) => {
  let postsDate = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/posts/allpostsdate`)).data
  res.render('signup', { postsDate });
});

app.get('/change-password', async (req, res) => {
  let postsDate = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/posts/allpostsdate`)).data
  res.render('change-password', { postsDate });
});

app.get('/create-post', async (req, res) => {
  let postsDate = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/posts/allpostsdate`)).data
  res.render('create-post', { postsDate });
});

app.get('/no-user', async (req, res) => {
  let postsDate = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/posts/allpostsdate`)).data
  res.render('no-user', { postsDate });
});

app.get('/temp-password', async (req, res) => {
  let postsDate = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/posts/allpostsdate`)).data
  res.render('temp-password', { postsDate });
});

app.get('/posts/:postid', async (req, res) => {
  let postsDate = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/posts/allpostsdate`)).data
  let { postid } = req.params

  let post = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/posts/findpost/${postid}`)).data
  let user = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/users/finduser/${post.data.userid}`)).data
  let imageData = await getBase64(post.data.imageURL)
  res.render('show-post', { postsDate, post: post.data, imageData, user: user.data })
});

app.post('/create-post', async (req, res) => {
  let { postTitle, postDescription, postImageURL, postEmail, postPassword } = req.body

  let email = postEmail.trim()
  let password = postPassword.trim()

  let userid = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/users/auth?email=${email}&password=${password}`)).data.id
  if (userid) {
    await axios.post('https://murmuring-fjord-10296.herokuapp.com/api/v1/posts', { title: postTitle, imageURL: postImageURL, description: postDescription, userid })
    res.redirect('/');
  } else {
    res.redirect('/no-user');
  }

});

app.post('/signup', async (req, res) => {
  let { signFullname, signEmail, signPhone } = req.body
  let fullname = signFullname
  let email = signEmail.trim()
  let phone = signPhone.trim()

  let user = (await axios.post(`https://murmuring-fjord-10296.herokuapp.com/api/v1/users`, { fullname, email, phone })).data

  if (user.status === 'OK') {
    return res.render('temp-password', { tempPassword: user.password });
  } else {
    return res.redirect('/no-user');
  }
})


app.post('/change-password', async (req, res) => {
  let { passwordEmail, passwordNew } = req.body
  let email = passwordEmail.trim()
  let password = passwordNew.trim()

  let users = (await axios.get(`https://murmuring-fjord-10296.herokuapp.com/api/v1/users`)).data.data
  let userid = (users.filter(user => user.email == email))[0].id
  if (userid) {
    await axios.put('https://murmuring-fjord-10296.herokuapp.com/api/v1/users', { userid, password })
    res.redirect('/')
  } else {
    res.redirect('/no-user');
  }
})

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
