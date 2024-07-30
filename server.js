const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/groceryDelivery', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
});
const User = mongoose.model('User', userSchema);

const orderSchema = new mongoose.Schema({
  items: [String],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
const Order = mongoose.model('Order', orderSchema);

app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword, role });
  await user.save();
  res.status(201).send('User registered');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(400).send('Invalid credentials');
  }
  const token = jwt.sign({ userId: user._id, role: user.role }, 'secretKey');
  res.send({ token });
});

app.post('/order', async (req, res) => {
  const { token, items } = req.body;
  const payload = jwt.verify(token, 'secretKey');
  const user = await User.findById(payload.userId);
  if (!user) {
    return res.status(403).send('Access denied');
  }
  const order = new Order({ items, user: user._id });
  await order.save();
  res.send('Order placed');
});

app.get('/orders', async (req, res) => {
  const orders = await Order.find().populate('user', 'username');
  res.send(orders);
});

app.listen(3000, () => console.log('Server started on port 3000'));
