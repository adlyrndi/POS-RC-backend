const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const uploadController = require('../controllers/uploadController');

router.post('/upload', uploadController.uploadImage);

router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.get('/', productController.getProducts);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
