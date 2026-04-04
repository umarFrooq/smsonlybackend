
const sellerProfile = {
    fullname: "Amazewear",
    stats: {
		followers: 2500,
		completedOrders: 120,
		shipOnTime: 30
    },
    orders: {
		pending: 12,
		InTransit: 10,
		delivered: 190,
		completed: 153
	},
    
    categories: [
		{
			id: "123455",
			name: "Clothing",
			mainImage: "/directory/image.jpg"
		}
	],
	vlogs:[{
id:"1245000",
userId: "123455sss",
url: "/directory/video.mpeg",
    }],
    generalStatistics:{
        videos: 12,
		likes: 100,
		visitorsPerDay: 1900,
		completed: 153
    },
    saleStatistics:{
        duration: ["jan","feb","March","April","May","June"],
		count: [177,107,422,222,551,66],
		
    }
  
};
const userProfile = {
    fullname: "Amazewear",
    orders: {
		pending: 12,
		InTransit: 10,
		delivered: 190,
		completed: 153
	},
    
    
  
};
module.exports = {
	sellerProfile,
	userProfile
  };