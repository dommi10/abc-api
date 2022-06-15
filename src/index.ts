import express, { Request, Response } from 'express';
import cors from 'cors';
import * as bcryptjs from 'bcryptjs';
import fileUpload from 'express-fileupload';
import { AppDataSource } from './data-source';
import {
  userRoutes,
  tokenRoutes,
  offreRoutes,
  entrepriseRoutes,
} from './routes';
import {
  sendEmail,
  validateAsEmail,
  validateAsPhoneNumber,
  validateAsString,
} from './utils';
import { niveau, User } from './entity/User.entity';

AppDataSource.initialize()
  .then(async () => {
    const PORT = process.env.PORT || 5000;
    // create express app
    const app = express();
    app.use(express.json());
    app.use(cors({ origin: '*' }));
    app.use(express.static('public'));

    app.use(
      fileUpload({
        createParentPath: true,
      }),
    );

    // register express routes from defined application routes
    app.use('/user', userRoutes.default);
    app.use('/token', tokenRoutes.default);
    app.use('/offres', offreRoutes.default);
    app.use('/entreprise', entrepriseRoutes.default);

    // setup express app here
    // ...
    app.get('/', (_req: Request, res: Response) => {
      return res.json({ message: 'welcome' });
    });

    app.post('/sendMail', async (req: Request, res: Response) => {
      try {
        const { email, tel, name, message } = req.body;
        if (!name || !validateAsString(name))
          return res.json({ message: 'name invalid' });
        if (!message || !validateAsString(message))
          return res.json({ message: 'message invalid' });
        if (!tel || !validateAsPhoneNumber(tel))
          return res.json({ message: 'tel invalid' });
        if (!email || !validateAsEmail(email))
          return res.json({ message: 'email invalid' });

        const val = await sendEmail({ email, tel, name, message });

        return res.json({
          status: val ? 200 : 500,
          message: val ? null : 'email not send',
        });
      } catch (error) {
        console.log(error);
        return res.json({ message: 'something went wrong try again' });
      }
    });
    // start express server
    app.listen(PORT, async () => {
      const user = new User();
      user.id = Date.now().toString();
      user.username = ('sysadmin' as string).toLocaleLowerCase();
      user.password = bcryptjs.hashSync('adminadmin');
      user.niveau = niveau.ADMIN;
      user.comment = '';
      user.isSuper = 1;
      user.statut = 1;

      if (
        !(await AppDataSource.getRepository(User).findOneBy({
          username: 'sysadmin',
        }))
      )
        await AppDataSource.getRepository(User).save(user);
      console.log('Server Running');
    });
  })
  .catch((error) => console.log(error));
