# import jwt
# import datetime

# # Secret key (must match your server's key)
# SECRET_KEY = "9f28a64c9c3d8f8f3b5d87a3e4a123a4b6723f1a8a3e6c6f7a6c123b87e4d6a5"


# # Payload data
# payload = {
#     "user_id": 123,
#     "role": "farmer",
#     "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=100)  # expires in 100 hour
# }

# # Generate token
# token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# print(token)
