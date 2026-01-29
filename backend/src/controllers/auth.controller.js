  import { registerUserService,loginUserService,} from "../services/auth.service.js";
  import { STATUS_CODES } from "../constants/statusCode.js";
  import { MESSAGES } from "../constants/message.js";
  
  export const register = async (req, res, next) => {
    try {
      const user = await registerUserService(req.body);
      res.status(STATUS_CODES.CREATED).json({
        message: MESSAGES.USER_CREATED,
        user,
      });
    } catch (error) {
      next(error);
    }
  };
  export const login = async (req, res, next) => {
    try {
      const { token, user } = await loginUserService(req.body);
      res.status(STATUS_CODES.SUCCESS).json({
        message: MESSAGES.LOGIN_SUCCESS,
        token,
        user,
      });
    } catch (error) {
      next(error);
    }
  };
  

