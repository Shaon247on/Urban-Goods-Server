const express = require('express');
const cors = require('cors');
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000


//---------------- MiddleWare ---------------- 
// app.use(cors())
app.use(express.json())


//-------------- MongoBD Connection --------------



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.k4uag68.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

         // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const productCollection = client.db('UrbanGoods').collection('AllProducts')

        app.get('/api/products', async (req, res) => {
            const filters = req.query;
            const page = (filters.page)
            const limit = parseInt(filters.limit)
            const skip = (page - 1) * limit;
            console.log('filtered Brand', page,limit);            
            
            const query = {};
        
            if (filters.category) {
                query.category = filters.category;
            }

            if (filters.brand) {
                query.brand = filters.brand;
            }
        
            if (filters.search) {
                query.productName = { $regex: filters.search, $options: 'i' };
            }
        
            const priceRange = filters.price ? filters.price.split(',').map(Number) : [0, Infinity];
            query.price = { $gte: priceRange[0], $lte: priceRange[1] };
        
            
            let sort = {};
        
            if (filters.sort) {
                if (filters.sort === 'lowToHigh') {
                    sort.price = 1;
                } else if (filters.sort === 'highToLow') {
                    sort.price = -1;
                } else if (filters.sort === 'createdAt') {
                    sort.createdAt = -1;
                }
            }
        
            try {
                const cursor = productCollection.find(query).sort(sort).skip(skip).limit(limit);                
                const totalItem = await productCollection.countDocuments({})
                const result = await cursor.toArray();
                const totalPages= Math.ceil(totalItem / limit)

                console.log(result);                           
                res.send({result,totalPages});
            } catch (error) {
                console.error('Error fetching products:', error);
                res.status(500).send('Failed to fetch products');
            }
        });
       
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('UrbanGoods is running')
})

app.listen(port, () => {
    console.log(`UrbanGoods is running on port ${port}`);
})