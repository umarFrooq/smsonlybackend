
const sellerHome = {
   
    orders: {
		pending: 12,
		InTransit: 10,
		delivered: 190,
		completed: 153
	},
    
    categories: [
		{
			id: "6001466e160d53c411ff338c",
			name: "Consumer Electronics",
			mainImage: "https://bazar-247.s3.us-east-2.amazonaws.com/categoriesMainImages/5fe1cbaac05d6b3eb844f6ed/Electric.jpg"
		},
		{
			id: "6001730f160d53c411ff33bc",
			name: "Health & Beauty",
			mainImage: "https://bazar-247.s3.us-east-2.amazonaws.com/categoriesMainImages/5fe1cbaac05d6b3eb844f6ed/Electric.jpg"
		},{
			id: "5ffc298545812602c8b11b19",
			name: "Clothing & Apparel",
			mainImage: "https://bazar-247.s3.us-east-2.amazonaws.com/categoriesMainImages/5ffc298545812602c8b11b19/clothes.jpg"
		}
	],
	vlogs:[{
id:"1245000",
userId: "123455sss",
url: "https://vintegavod.s.llnwi.net/video/vintegavod/VOD/affordable party wear dresses _ Organza _ Designer Dress_ Ladies cloth shop in Raja bazar Rawalpindi.mp4",
    },
	{
		id:"1245001",
		userId: "123455ssssss",
		url: "https://vintegavod.s.llnwi.net/video/vintegavod/VOD/jewellery collection _ Pakistani Bridal Jewellery Collection With Price _ Barat & Walima Jewellery.mp4",
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

module.exports = {
	sellerHome,

  };