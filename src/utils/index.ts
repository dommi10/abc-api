import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import dayjs from 'dayjs';
import { IRequest, UserType } from '../helpers';
import { getFilesFromPath, Web3Storage } from 'web3.storage';

dotenv.config();

const web3_storage = new Web3Storage({
  token: process.env.WEB3_STORAGE_TOKEN ?? '',
});

/**
 *
 * @param file
 * @returns url as String if success or null if failed
 */
export async function uploadFileToStorage(
  dir: string,
  filename: string,
): Promise<string | null> {
  try {
    const files = await getFilesFromPath(dir);
    const cid = await web3_storage.put(files, { name: filename });
    return `https://${cid}.ipfs.dweb.link/images/${filename}`;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export function formatFileName(orinalName: string): string {
  return (
    dayjs().format('YYYY-MM-DD-HH-mm-ss-sss') +
    '-' +
    '-' +
    orinalName.replace(/ /g, '').replace(path.extname(orinalName), '') +
    path.extname(orinalName)
  );
}
/**
 * Returns a hash representation of user information
 * @param user as user object information
 * @returns token as string
 */
export function signToken({
  user,
  expiresIn,
}: {
  user: UserType;
  expiresIn: string;
}): string {
  return jwt.sign(user, process.env.PRIVATE_KEY ?? '', {
    expiresIn,
  });
}
/**
 * Returns a hash representation of user information
 * @param user as user object information
 * @returns token as string
 */
export async function sendEmail({
  email,
  tel,
  name,
  message,
}: {
  email: string;
  name: string;
  tel: string;
  message: string;
}): Promise<boolean> {
  try {
    const params = {
      service_id: process.env.SERVICE_ID,
      template_id: process.env.TEMPLATE_ID,
      user_id: process.env.PUBLIC_ID,
      template_params: {
        from_name: name,
        message: message,
        email: email,
        tel: tel,
      },
    };

    const res = await axios.post(
      '/api/v1.0/email/send',
      { ...params },
      {
        baseURL: 'https://api.emailjs.com',
      },
    );
    const { data } = res;
    if (res.status == 200) {
      return true;
    }
    console.log(data);
    return false;
  } catch (error: any) {
    console.log(error.message);
    return false;
  }
}

/**
 *
 * @param password
 * @returns
 */
export function validateAsPassword(password: string): boolean {
  return /^(?=.*[\w\d@$!%*#?&])[\w\d@$!%*#?&]{8,32}/i.test(password);
}

export function validateAsStringNumber(value: string): boolean {
  return /^([\w\d????????????????????????????????????????????????????????????????])([\w\- ????????????????????????????????????????????????????????????????()_'\d,/]{1,})$/i.test(
    value,
  );
}

/**
 *
 * @param value
 * @returns
 */
export function validateAsString(value: string): boolean {
  return /^([\w????????????????????????????????????????????????????????????????])([\w\- ????????????????????????????????????????????????????????????????()'_\d,/]{1,})$/i.test(
    value,
  );
}

export function validateAsNumber(value: string): boolean {
  return /^([\w\d????????????????????????????????????????????????????????????????])([\w\- ????????????????????????????????????????????????????????????????()'_\d,/]{1,})$/i.test(
    value,
  );
}

/**
 *
 * @param value
 * @returns
 */
export function validateAsEmail(value: string): boolean {
  return /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/i.test(value);
}
/**
 *
 * @param value | eg. 1980-10-12
 * @returns true if is date accepted format
 */
export function validateAsDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/i.test(value);
}

/**
 *
 * @param value | eg. 1980-10-12
 * @returns true if is date accepted format
 */
export function validateAsDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/i.test(value);
}

/**
 *
 * @param value | eg. 1
 * @returns true if is digit
 */
export function validateAsDigit(value: string): boolean {
  return /\d$/i.test(value);
}
/**
 *
 * @param value | eg. 1980-10-12
 * @returns true if is date accepted format
 */
export function validateAsCaisseEtat(value: string): boolean {
  return /^[0-1]{1}$/i.test(value);
}
/**
 *
 * @param value
 * @returns
 */
export function validateAsAcreditaion(value: string): boolean {
  return /^([1-6])([1-6,]{0,})$/i.test(value);
}

/**
 *
 * @param value
 * @returns
 */
export function validateAsStringForQuery(value: string): boolean {
  return /^([\w\d????????????????????????????????????????????????????????????????])([\w\- ????????????????????????????????????????????????????????????????'_\d]{1,})$/i.test(
    value,
  );
}

/**
 *
 * @param value
 * @returns
 */
export function validateAsStringForEmailQuery(value: string): boolean {
  return /^([\w\d????????????????????????????????????????????????????????????????])([\w\- ????????????????????????????????????????????????????????????????'_\d@.]{1,})$/i.test(
    value,
  );
}

/**
 *
 * @param number as string representation to be format
 * @returns as  representation of telephone format eg 243 900000000
 */
export function formatToNumber(number: string): string {
  if (number.length === 12)
    return number.substring(0, 3).concat(' ').concat(number.substring(3));
  if (number.length === 11)
    return number.substring(0, 2).concat(' ').concat(number.substring(2));
  return number.charAt(0).concat(' ').concat(number.substring(1));
}

export function validateAsPhoneNumber(tel: string): boolean {
  return /^([\d]{1,3})([ ]{1}[\d]{8,9})$/i.test(formatToNumber(tel));
}

export function getComment(req: IRequest): string {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  return `${ip}/${req.user?.username}`;
}

export function generateRandomString(length: number): string {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Return boolean as result | true if message successfully send
 * @param tel
 * @param message
 * @returns
 */
export async function sendSMS(
  numbers: Array<string>,
  message: string,
  title?: string,
): Promise<boolean> {
  try {
    if (!title) title = 'Abecha';
    const smsApi = {
      username: process.env.ES_USERNAME,
      psswd: process.env.ES_PASSWORD,
      from: title,
      to: numbers.join(),
      message,
      type: 0,
    };

    const smsSender = await axios.post(
      encodeURI(
        `https://www.easysendsms.com/sms/bulksms-api/bulksms-api?username=${smsApi.username}&password=${smsApi.psswd}&from=${smsApi.from}&to=${smsApi.to}&text=${message}&type=${smsApi.type}`,
      ),
    );

    if (smsSender.data.includes('OK')) return true;
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}

/**
 * Return boolean as result | true if message successfully send
 * @param numbers
 * @param message
 * @returns
 */
export async function sendDiffussionSMS(
  numbers: Array<string>,
  message: string,
  title?: string,
): Promise<boolean> {
  try {
    if (!title) title = 'Abecha';

    if (numbers.length === 0) return false;

    return await sendSMS(numbers, message, title);

    let sendNumbers: Array<{
      body: string;
      to: string;
      from: string;
    }> = [];

    const chunkSize = 1000;
    for (let i = 0; i < numbers.length; i += chunkSize) {
      const chunk = numbers.slice(i, i + chunkSize);
      sendNumbers = chunk.map((tel) => {
        return {
          body: message,
          to: tel,
          from: title ? title : 'Abecha',
        };
      });

      const smsSender = await axios.post(
        'https://rest.clicksend.com/v3/sms/send',
        {
          messages: sendNumbers,
        },
        {
          auth: {
            username: process.env.CLICK_USERNAME ?? '',
            password: process.env.CLICK_PASSWORD ?? '',
          },
        },
      );
      if (smsSender.data && smsSender.data.http_code === 200) return true;
      // do whatever
    }

    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}

/**
 * Return boolean as result | true if message successfully send
 * @param tel
 * @param message
 * @returns
 */
export async function priceSMS(message: string): Promise<number> {
  try {
    const smsSender = await axios.post(
      'https://rest.clicksend.com/v3/sms/price',
      {
        messages: [
          {
            body: message,
            to: '243971955445',
            from: 'Abecha',
          },
        ],
      },
      {
        auth: {
          username: process.env.CLICK_USERNAME ?? '',
          password: process.env.CLICK_PASSWORD ?? '',
        },
      },
    );

    if (smsSender.data && smsSender.data.http_code === 200) {
      return Number.parseFloat(
        '' + smsSender.data.data.messages[0].message_parts,
      );
    }
    return -1;
  } catch (error) {
    console.log(error);
    return -1;
  }
}

export const EXPIRE_ACCESS_TOKEN = '900000';
export const EXPIRE_REFRESH_TOKEN = '30d';
export const EXPIRE_DAILY_REFRESH_TOKEN = '1d';
