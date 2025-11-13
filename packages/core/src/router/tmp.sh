
curl \
--user "euuoxeqo:3351126f-00d2-4964-840f-a8e29fb4f2c5" \
--digest \
--header 'Accept: application/vnd.atlas.2024-11-13+json' \
--header 'Content-Type: application/json' \
--request GET "https://cloud.mongodb.com/api/atlas/v2/groups/64619e3fea3ebc1bb3d691f3/streams/accountDetails?cloudProvider=aws&regionName=US_EAST_1"


{
    "awsAccountId":"821274765805",
    "cidrBlock":"192.168.248.0/21",
    "vpcId":"vpc-04a8f4b80f14357ef",
    "cloudProvider":"aws"
    }